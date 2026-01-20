import { Controller, Inject, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StripeService } from '../../services/stripe/stripe.service';
import { PaypalService } from '../../services/paypal/paypal.service';
import type { ScheduleRepositoryPort } from '../../../core/port/schedule-repository.port';
import type { PaymentIntentRepositoryPort } from '../../../core/port/payment-intent-repository.port';
import type { PaymentEventRepositoryPort } from '../../../core/port/payment-event-repository.port';
import type { StripeAccountRepositoryPort } from '../../../core/port/stripe-account-repository.port';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';
import type { GoCardlessAccountRepositoryPort } from '../../../core/port/gocardless-account-repository.port';

// ==================== TYPE INTERFACES ====================

interface GetByIdRequest {
  id: string;
  societeId: string;
}

interface CreateStripeCheckoutSessionRequest {
  societeId: string;
  amount: number;
  currency: string;
  mode: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
  priceId?: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    name: string;
    description: string;
    amount: number;
    quantity: number;
    currency: string;
  }>;
}

interface CreateStripePaymentIntentRequest {
  societeId: string;
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  confirm: boolean;
  automaticPaymentMethods: boolean;
  metadata?: Record<string, string>;
}

interface CreateStripeCustomerRequest {
  societeId: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

interface CreateStripeSubscriptionRequest {
  societeId: string;
  customerId: string;
  priceId: string;
  defaultPaymentMethod?: string;
  metadata?: Record<string, string>;
}

interface CreateStripeSetupIntentRequest {
  societeId: string;
  customerId?: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
}

interface CreateStripeBillingPortalRequest {
  societeId: string;
  customerId: string;
  returnUrl: string;
}

interface CreatePayPalOrderRequest {
  societeId: string;
  intent: string;
  purchaseUnits: Array<{
    referenceId?: string;
    amount: number;
    currency: string;
    description?: string;
    customId?: string;
    invoiceId?: string;
  }>;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface GetPayPalOrderRequest {
  orderId: string;
  societeId: string;
}

interface CapturePayPalOrderRequest {
  orderId: string;
  societeId: string;
}

interface GetPSPAccountsRequest {
  societeId: string;
}

@Controller()
export class PaymentGrpcController {
  private readonly logger = new Logger(PaymentGrpcController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paypalService: PaypalService,
    @Inject('ScheduleRepositoryPort')
    private readonly scheduleRepository: ScheduleRepositoryPort,
    @Inject('PaymentIntentRepositoryPort')
    private readonly paymentIntentRepository: PaymentIntentRepositoryPort,
    @Inject('PaymentEventRepositoryPort')
    private readonly paymentEventRepository: PaymentEventRepositoryPort,
    @Inject('StripeAccountRepositoryPort')
    private readonly stripeAccountRepository: StripeAccountRepositoryPort,
    @Inject('PaypalAccountRepositoryPort')
    private readonly paypalAccountRepository: PaypalAccountRepositoryPort,
    @Inject('GoCardlessAccountRepositoryPort')
    private readonly gocardlessAccountRepository: GoCardlessAccountRepositoryPort,
  ) {}

  // ==================== STRIPE METHODS ====================

  @GrpcMethod('PaymentService', 'CreateStripeCheckoutSession')
  async createStripeCheckoutSession(request: CreateStripeCheckoutSessionRequest) {
    this.logger.log(`gRPC: CreateStripeCheckoutSession for societe ${request.societeId}`);

    const session = await this.stripeService.createCheckoutSession({
      societeId: request.societeId,
      amount: request.amount,
      currency: request.currency,
      mode: request.mode as 'payment' | 'subscription' | 'setup',
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      customerId: request.customerId,
      customerEmail: request.customerEmail,
      priceId: request.priceId,
      metadata: request.metadata,
      lineItems: request.lineItems,
    });

    return {
      id: session.id,
      url: session.url,
      status: session.status,
      paymentStatus: session.payment_status,
      customerId: session.customer as string,
      subscriptionId: session.subscription as string,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripePaymentIntent')
  async createStripePaymentIntent(request: CreateStripePaymentIntentRequest) {
    this.logger.log(`gRPC: CreateStripePaymentIntent for societe ${request.societeId}`);

    const paymentIntent = await this.stripeService.createPaymentIntent({
      societeId: request.societeId,
      amount: request.amount,
      currency: request.currency,
      customerId: request.customerId,
      automaticPaymentMethods: request.automaticPaymentMethods,
      metadata: request.metadata,
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      customerId: paymentIntent.customer as string,
      paymentMethod: paymentIntent.payment_method as string,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeCustomer')
  async createStripeCustomer(request: CreateStripeCustomerRequest) {
    this.logger.log(`gRPC: CreateStripeCustomer for societe ${request.societeId}`);

    const customer = await this.stripeService.createCustomer({
      societeId: request.societeId,
      email: request.email,
      name: request.name,
      phone: request.phone,
      metadata: request.metadata,
    });

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      created: customer.created,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeSubscription')
  async createStripeSubscription(request: CreateStripeSubscriptionRequest) {
    this.logger.log(`gRPC: CreateStripeSubscription for customer ${request.customerId}`);

    const subscription = await this.stripeService.createSubscription({
      societeId: request.societeId,
      customerId: request.customerId,
      priceId: request.priceId,
      metadata: request.metadata,
    });

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeSetupIntent')
  async createStripeSetupIntent(request: CreateStripeSetupIntentRequest) {
    this.logger.log(`gRPC: CreateStripeSetupIntent for societe ${request.societeId}`);

    const setupIntent = await this.stripeService.createSetupIntent({
      societeId: request.societeId,
      customerId: request.customerId,
      paymentMethodTypes: request.paymentMethodTypes,
      metadata: request.metadata,
    });

    return {
      id: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      status: setupIntent.status,
      customerId: setupIntent.customer as string,
      paymentMethod: setupIntent.payment_method as string,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeBillingPortalSession')
  async createStripeBillingPortalSession(request: CreateStripeBillingPortalRequest) {
    this.logger.log(`gRPC: CreateStripeBillingPortalSession for customer ${request.customerId}`);

    const session = await this.stripeService.createBillingPortalSession({
      societeId: request.societeId,
      customerId: request.customerId,
      returnUrl: request.returnUrl,
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  // ==================== PAYPAL METHODS ====================

  @GrpcMethod('PaymentService', 'CreatePayPalOrder')
  async createPayPalOrder(request: CreatePayPalOrderRequest) {
    this.logger.log(`gRPC: CreatePayPalOrder for societe ${request.societeId}`);

    const order = await this.paypalService.createOrder({
      societeId: request.societeId,
      intent: request.intent as 'CAPTURE' | 'AUTHORIZE',
      purchaseUnits: request.purchaseUnits,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
      metadata: request.metadata,
    });

    return {
      id: order.id,
      status: order.status,
      approveUrl: this.paypalService.extractApproveUrl(order),
      captureUrl: this.paypalService.extractCaptureUrl(order),
      links: order.links?.map((link) => ({
        href: link.href,
        rel: link.rel,
        method: link.method,
      })),
    };
  }

  @GrpcMethod('PaymentService', 'GetPayPalOrder')
  async getPayPalOrder(request: GetPayPalOrderRequest) {
    this.logger.log(`gRPC: GetPayPalOrder ${request.orderId}`);

    const order = await this.paypalService.getOrder(request.societeId, request.orderId);

    return {
      id: order.id,
      status: order.status,
      approveUrl: this.paypalService.extractApproveUrl(order),
      captureUrl: this.paypalService.extractCaptureUrl(order),
      links: order.links?.map((link) => ({
        href: link.href,
        rel: link.rel,
        method: link.method,
      })),
    };
  }

  @GrpcMethod('PaymentService', 'CapturePayPalOrder')
  async capturePayPalOrder(request: CapturePayPalOrderRequest) {
    this.logger.log(`gRPC: CapturePayPalOrder ${request.orderId}`);

    const order = await this.paypalService.captureOrder({
      societeId: request.societeId,
      orderId: request.orderId,
    });

    return {
      id: order.id,
      status: order.status,
      payer: order.payer
        ? {
            emailAddress: order.payer.emailAddress,
            payerId: order.payer.payerId,
            givenName: order.payer.name?.givenName,
            surname: order.payer.name?.surname,
          }
        : undefined,
      purchaseUnits: order.purchaseUnits?.map((unit) => ({
        referenceId: unit.referenceId,
        captures: unit.payments?.captures?.map((capture) => ({
          id: capture.id,
          status: capture.status,
          amount: {
            currencyCode: capture.amount?.currencyCode,
            value: capture.amount?.value,
          },
        })),
      })),
    };
  }

  @GrpcMethod('PaymentService', 'AuthorizePayPalOrder')
  async authorizePayPalOrder(request: GetPayPalOrderRequest) {
    this.logger.log(`gRPC: AuthorizePayPalOrder ${request.orderId}`);

    const order = await this.paypalService.authorizeOrder(request.societeId, request.orderId);

    return {
      id: order.id,
      status: order.status,
      links: order.links?.map((link) => ({
        href: link.href,
        rel: link.rel,
        method: link.method,
      })),
    };
  }

  // ==================== SCHEDULE METHODS ====================

  @GrpcMethod('PaymentService', 'GetSchedule')
  async getSchedule(request: GetByIdRequest) {
    this.logger.log(`gRPC: GetSchedule ${request.id}`);

    const schedule = await this.scheduleRepository.findById(request.id);
    if (!schedule) {
      throw new Error(`Schedule ${request.id} not found`);
    }

    return this.mapScheduleToResponse(schedule);
  }

  @GrpcMethod('PaymentService', 'DeleteSchedule')
  async deleteSchedule(request: GetByIdRequest) {
    this.logger.log(`gRPC: DeleteSchedule ${request.id}`);

    await this.scheduleRepository.delete(request.id);
    return { success: true, message: `Schedule ${request.id} deleted` };
  }

  // ==================== PAYMENT INTENT METHODS ====================

  @GrpcMethod('PaymentService', 'GetPaymentIntent')
  async getPaymentIntent(request: GetByIdRequest) {
    this.logger.log(`gRPC: GetPaymentIntent ${request.id}`);

    const paymentIntent = await this.paymentIntentRepository.findById(request.id);
    if (!paymentIntent) {
      throw new Error(`PaymentIntent ${request.id} not found`);
    }

    return this.mapPaymentIntentToResponse(paymentIntent);
  }

  @GrpcMethod('PaymentService', 'DeletePaymentIntent')
  async deletePaymentIntent(request: GetByIdRequest) {
    this.logger.log(`gRPC: DeletePaymentIntent ${request.id}`);

    await this.paymentIntentRepository.delete(request.id);
    return { success: true, message: `PaymentIntent ${request.id} deleted` };
  }

  // ==================== PAYMENT EVENT METHODS ====================

  @GrpcMethod('PaymentService', 'GetPaymentEvent')
  async getPaymentEvent(request: GetByIdRequest) {
    this.logger.log(`gRPC: GetPaymentEvent ${request.id}`);

    const event = await this.paymentEventRepository.findById(request.id);
    if (!event) {
      throw new Error(`PaymentEvent ${request.id} not found`);
    }

    return this.mapPaymentEventToResponse(event);
  }

  // ==================== PSP ACCOUNTS METHODS ====================

  @GrpcMethod('PaymentService', 'GetPSPAccountsSummary')
  async getPSPAccountsSummary(request: GetPSPAccountsRequest) {
    this.logger.log(`gRPC: GetPSPAccountsSummary for societe ${request.societeId}`);

    const [stripeAccount, paypalAccount, gocardlessAccount] = await Promise.all([
      this.stripeAccountRepository.findBySocieteId(request.societeId).catch(() => null),
      this.paypalAccountRepository.findBySocieteId(request.societeId).catch(() => null),
      this.gocardlessAccountRepository.findBySocieteId(request.societeId).catch(() => null),
    ]);

    return {
      stripe: stripeAccount
        ? {
            id: stripeAccount.id,
            name: stripeAccount.nom,
            isActive: stripeAccount.actif,
            isLiveMode: stripeAccount.isLiveMode(),
            isConfigured: stripeAccount.isConfigured(),
          }
        : undefined,
      paypal: paypalAccount
        ? {
            id: paypalAccount.id,
            name: paypalAccount.nom,
            isActive: paypalAccount.actif,
            isLiveMode: paypalAccount.isLiveMode(),
            isConfigured: paypalAccount.isConfigured(),
          }
        : undefined,
      gocardless: gocardlessAccount
        ? {
            id: gocardlessAccount.id,
            name: gocardlessAccount.nom,
            isActive: gocardlessAccount.actif,
            isLiveMode: gocardlessAccount.isLiveMode(),
            isConfigured: gocardlessAccount.isConfigured(),
          }
        : undefined,
    };
  }

  // ==================== HELPER METHODS ====================

  private mapScheduleToResponse(schedule: any) {
    return {
      id: schedule.id,
      organisationId: schedule.organisationId,
      societeId: schedule.societeId,
      contratId: schedule.contratId,
      factureId: schedule.factureId,
      clientId: schedule.clientId,
      amount: schedule.amount,
      currency: schedule.currency,
      dueDate: schedule.dueDate?.toISOString(),
      status: schedule.status,
      lastAttemptAt: schedule.lastAttemptAt?.toISOString(),
      paidAt: schedule.paidAt?.toISOString(),
      retryCount: schedule.retryCount || 0,
      errorMessage: schedule.errorMessage,
    };
  }

  private mapPaymentIntentToResponse(intent: any) {
    return {
      id: intent.id,
      organisationId: intent.organisationId,
      societeId: intent.societeId,
      scheduleId: intent.scheduleId,
      pspName: intent.pspName,
      pspPaymentId: intent.pspPaymentId,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      mandateReference: intent.mandateReference,
      idempotencyKey: intent.idempotencyKey,
      errorCode: intent.errorCode,
      errorMessage: intent.errorMessage,
      createdAt: intent.createdAt?.toISOString(),
      updatedAt: intent.updatedAt?.toISOString(),
    };
  }

  private mapPaymentEventToResponse(event: any) {
    return {
      id: event.id,
      organisationId: event.organisationId,
      paymentIntentId: event.paymentIntentId,
      eventType: event.eventType,
      rawPayload: event.rawPayload,
      receivedAt: event.receivedAt?.toISOString(),
      processed: event.processed,
      processedAt: event.processedAt?.toISOString(),
      errorMessage: event.errorMessage,
    };
  }
}

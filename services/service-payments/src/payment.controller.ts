import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StripeService } from './modules/stripe/stripe.service';
import { PaypalService } from './modules/paypal/paypal.service';
import { GoCardlessService } from './modules/gocardless/gocardless.service';
import { SlimpayService } from './modules/slimpay/slimpay.service';
import { MultiSafepayService } from './modules/multisafepay/multisafepay.service';
import { EmerchantpayService } from './modules/emerchantpay/emerchantpay.service';
import { SchedulesService } from './modules/schedules/schedules.service';
import { RetryClientService } from './modules/retry/retry-client.service';
import { PaymentProvider, ScheduleFrequency } from './modules/schedules/entities/schedule.entity';
import { PaymentIntentStatus } from './modules/schedules/entities/payment-intent.entity';
import type {
  CreateStripeCheckoutSessionRequest,
  StripeCheckoutSessionResponse,
  CreateStripePaymentIntentRequest,
  StripePaymentIntentResponse,
  CreateStripeCustomerRequest,
  StripeCustomerResponse,
  CreateStripeSubscriptionRequest,
  StripeSubscriptionResponse,
  GetByIdRequest,
  CreateStripeRefundRequest,
  StripeRefundResponse,
  CreatePayPalOrderRequest,
  PayPalOrderResponse,
  GetPayPalOrderRequest,
  CapturePayPalOrderRequest,
  PayPalCaptureResponse,
  SetupGoCardlessMandateRequest,
  GoCardlessMandateResponse,
  GetGoCardlessMandateRequest,
  CreateGoCardlessPaymentRequest,
  GoCardlessPaymentResponse,
  CreateScheduleRequest,
  ScheduleResponse,
  UpdateScheduleRequest,
  DeleteResponse,
  GetDueSchedulesRequest,
  ScheduleListResponse,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  UpdatePaymentIntentRequest,
  GetPSPAccountsRequest,
  PSPAccountsSummaryResponse,
} from '@proto/payments/payment';

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paypalService: PaypalService,
    private readonly goCardlessService: GoCardlessService,
    private readonly slimpayService: SlimpayService,
    private readonly multisafepayService: MultiSafepayService,
    private readonly emerchantpayService: EmerchantpayService,
    private readonly schedulesService: SchedulesService,
    private readonly retryClient: RetryClientService,
  ) {}


  // ==================== STRIPE ====================

  @GrpcMethod('PaymentService', 'CreateStripeCheckoutSession')
  async createStripeCheckoutSession(data: CreateStripeCheckoutSessionRequest): Promise<StripeCheckoutSessionResponse> {
    this.logger.log(`CreateStripeCheckoutSession for societe: ${data.societeId}`);

    const result = await this.stripeService.createCheckoutSession(data.societeId, {
      amount: data.amount / 100, // Convert from centimes
      currency: data.currency || 'eur',
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      customerEmail: data.customerEmail,
      clientReferenceId: data.customerId,
      metadata: data.metadata,
    });

    return {
      id: result.sessionId,
      url: result.sessionUrl,
      status: 'open',
      paymentStatus: 'unpaid',
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripePaymentIntent')
  async createStripePaymentIntent(data: CreateStripePaymentIntentRequest): Promise<StripePaymentIntentResponse> {
    this.logger.log(`CreateStripePaymentIntent for societe: ${data.societeId}`);

    const result = await this.stripeService.createPaymentIntent(data.societeId, {
      amount: data.amount / 100,
      currency: data.currency || 'eur',
      customerId: data.customerId,
      paymentMethodId: data.paymentMethod,
      metadata: data.metadata,
      confirm: data.confirm,
    });

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      clientSecret: result.client_secret ?? undefined,
      customerId: result.customer?.toString(),
      paymentMethod: result.payment_method?.toString(),
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeCustomer')
  async createStripeCustomer(data: CreateStripeCustomerRequest): Promise<StripeCustomerResponse> {
    this.logger.log(`CreateStripeCustomer for societe: ${data.societeId}`);

    const result = await this.stripeService.createCustomer(data.societeId, {
      email: data.email,
      name: data.name,
      metadata: data.metadata,
    });

    return {
      id: result.id,
      email: result.email ?? '',
      name: result.name ?? undefined,
      phone: result.phone ?? undefined,
      created: result.created,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeSubscription')
  async createStripeSubscription(data: CreateStripeSubscriptionRequest): Promise<StripeSubscriptionResponse> {
    this.logger.log(`CreateStripeSubscription for societe: ${data.societeId}`);

    const result = await this.stripeService.createSubscription(data.societeId, {
      customerId: data.customerId,
      priceId: data.priceId,
      metadata: data.metadata,
    });

    const subscription = result as any;
    return {
      id: result.id,
      customerId: result.customer?.toString() ?? '',
      status: result.status,
      currentPeriodStart: subscription.current_period_start ?? 0,
      currentPeriodEnd: subscription.current_period_end ?? 0,
      cancelAtPeriodEnd: result.cancel_at_period_end,
    };
  }

  @GrpcMethod('PaymentService', 'CancelStripeSubscription')
  async cancelStripeSubscription(data: GetByIdRequest): Promise<StripeSubscriptionResponse> {
    this.logger.log(`CancelStripeSubscription: ${data.id}`);

    const result = await this.stripeService.cancelSubscription(data.societeId, data.id);

    const subscription = result as any;
    return {
      id: result.id,
      customerId: result.customer?.toString() ?? '',
      status: result.status,
      currentPeriodStart: subscription.current_period_start ?? 0,
      currentPeriodEnd: subscription.current_period_end ?? 0,
      cancelAtPeriodEnd: result.cancel_at_period_end,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripeRefund')
  async createStripeRefund(data: CreateStripeRefundRequest): Promise<StripeRefundResponse> {
    this.logger.log(`CreateStripeRefund for payment: ${data.paymentIntentId}`);

    const result = await this.stripeService.createRefund(data.societeId, {
      paymentIntentId: data.paymentIntentId,
      amount: data.amount ? data.amount / 100 : undefined,
      reason: data.reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
    });

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status ?? '',
      paymentIntentId: result.payment_intent?.toString() ?? '',
    };
  }

  // ==================== PAYPAL ====================

  @GrpcMethod('PaymentService', 'CreatePayPalOrder')
  async createPayPalOrder(data: CreatePayPalOrderRequest): Promise<PayPalOrderResponse> {
    this.logger.log(`CreatePayPalOrder for societe: ${data.societeId}`);

    const purchaseUnit = data.purchaseUnits?.[0];
    const amount = purchaseUnit?.amount || 0;

    const result = await this.paypalService.createOrder(data.societeId, {
      amount: amount / 100,
      currency: purchaseUnit?.currency || 'EUR',
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
      description: purchaseUnit?.description,
      referenceId: purchaseUnit?.referenceId,
    });

    return {
      id: result.orderId,
      status: 'CREATED',
      approveUrl: result.approvalUrl,
      links: [
        { href: result.approvalUrl, rel: 'approve', method: 'GET' },
      ],
    };
  }

  @GrpcMethod('PaymentService', 'GetPayPalOrder')
  async getPayPalOrder(data: GetPayPalOrderRequest): Promise<PayPalOrderResponse> {
    this.logger.log(`GetPayPalOrder: ${data.orderId}`);

    const result = await this.paypalService.getOrder(data.societeId, data.orderId);

    const approveLink = result.links?.find((l: any) => l.rel === 'approve');

    return {
      id: result.id,
      status: result.status,
      approveUrl: approveLink?.href,
      links: result.links?.map((l: any) => ({
        href: l.href,
        rel: l.rel,
        method: l.method,
      })) || [],
    };
  }

  @GrpcMethod('PaymentService', 'CapturePayPalOrder')
  async capturePayPalOrder(data: CapturePayPalOrderRequest): Promise<PayPalCaptureResponse> {
    this.logger.log(`CapturePayPalOrder: ${data.orderId}`);

    const result = await this.paypalService.captureOrder(data.societeId, data.orderId);

    return {
      id: result.captureId,
      status: result.status,
      purchaseUnits: [
        {
          captures: [
            {
              id: result.captureId,
              status: result.status,
              amount: {
                currencyCode: result.currency,
                value: result.amount.toString(),
              },
            },
          ],
        },
      ],
    };
  }

  // ==================== GOCARDLESS ====================

  @GrpcMethod('PaymentService', 'SetupGoCardlessMandate')
  async setupGoCardlessMandate(data: SetupGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    this.logger.log(`SetupGoCardlessMandate for client: ${data.clientId}`);

    const result = await this.goCardlessService.createBillingRequest(data.societeId, {
      clientId: data.clientId,
      description: data.description,
      redirectUri: data.successRedirectUrl,
    });

    return {
      id: result.billingRequestId,
      clientId: data.clientId,
      mandateId: '',
      status: 'pending_customer_approval',
      scheme: data.scheme || 'sepa_core',
      redirectUrl: result.authorisationUrl,
    };
  }

  @GrpcMethod('PaymentService', 'GetGoCardlessMandate')
  async getGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    this.logger.log(`GetGoCardlessMandate for client: ${data.clientId}`);

    const mandate = await this.goCardlessService.getActiveMandate(
      data.societeId,
      data.clientId,
    );

    if (!mandate) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No active mandate found for client ${data.clientId}`,
      });
    }

    return {
      id: mandate.id,
      clientId: mandate.clientId,
      mandateId: mandate.mandateId,
      status: mandate.status,
      scheme: mandate.scheme,
      bankName: mandate.bankName,
      accountHolderName: mandate.accountHolderName,
      accountNumberEnding: mandate.accountNumberEnding,
    };
  }

  @GrpcMethod('PaymentService', 'CancelGoCardlessMandate')
  async cancelGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    this.logger.log(`CancelGoCardlessMandate for client: ${data.clientId}`);

    const mandate = await this.goCardlessService.getActiveMandate(
      data.societeId,
      data.clientId,
    );

    if (!mandate) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No active mandate found for client ${data.clientId}`,
      });
    }

    await this.goCardlessService.cancelMandate(data.societeId, mandate.id);

    return {
      id: mandate.id,
      clientId: data.clientId,
      mandateId: mandate.mandateId,
      status: 'cancelled',
      scheme: mandate.scheme,
    };
  }

  @GrpcMethod('PaymentService', 'CreateGoCardlessPayment')
  async createGoCardlessPayment(data: CreateGoCardlessPaymentRequest): Promise<GoCardlessPaymentResponse> {
    this.logger.log(`CreateGoCardlessPayment for client: ${data.clientId}`);

    const mandate = await this.goCardlessService.getActiveMandate(
      data.societeId,
      data.clientId,
    );

    if (!mandate) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No active mandate found for client ${data.clientId}`,
      });
    }

    const result = await this.goCardlessService.createPayment(data.societeId, {
      mandateId: mandate.id,
      amount: data.amount / 100,
      currency: data.currency || 'EUR',
      description: data.description,
      chargeDate: data.chargeDate,
      metadata: data.metadata,
    });

    return {
      id: result.paymentId,
      paymentId: result.paymentId,
      amount: data.amount,
      currency: data.currency || 'EUR',
      status: result.status,
      chargeDate: result.chargeDate,
    };
  }

  // ==================== SCHEDULES ====================

  @GrpcMethod('PaymentService', 'CreateSchedule')
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleResponse> {
    this.logger.log(`CreateSchedule for societe: ${data.societeId}`);

    const schedule = await this.schedulesService.createSchedule({
      organisationId: data.organisationId,
      clientId: data.clientId ?? '',
      societeId: data.societeId,
      contratId: data.contratId,
      factureId: data.factureId,
      provider: PaymentProvider.STRIPE, // Default, can be overridden
      providerAccountId: '', // Will need to be resolved
      amount: data.amount / 100,
      currency: data.currency || 'EUR',
      frequency: ScheduleFrequency.MONTHLY,
      startDate: new Date(data.dueDate),
      metadata: data.metadata,
    });

    return this.mapScheduleToResponse(schedule);
  }

  @GrpcMethod('PaymentService', 'GetSchedule')
  async getSchedule(data: GetByIdRequest): Promise<ScheduleResponse> {
    this.logger.log(`GetSchedule: ${data.id}`);

    const schedule = await this.schedulesService.getScheduleById(data.id);

    if (!schedule) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Schedule ${data.id} not found`,
      });
    }

    return this.mapScheduleToResponse(schedule);
  }

  @GrpcMethod('PaymentService', 'UpdateSchedule')
  async updateSchedule(data: UpdateScheduleRequest): Promise<ScheduleResponse> {
    this.logger.log(`UpdateSchedule: ${data.id}`);

    const schedule = await this.schedulesService.getScheduleById(data.id);

    if (!schedule) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Schedule ${data.id} not found`,
      });
    }

    if (data.status === 'PAUSED') {
      return this.mapScheduleToResponse(await this.schedulesService.pauseSchedule(data.id));
    }

    if (data.status === 'ACTIVE') {
      return this.mapScheduleToResponse(await this.schedulesService.resumeSchedule(data.id));
    }

    if (data.status === 'CANCELLED') {
      return this.mapScheduleToResponse(await this.schedulesService.cancelSchedule(data.id));
    }

    return this.mapScheduleToResponse(schedule);
  }

  @GrpcMethod('PaymentService', 'DeleteSchedule')
  async deleteSchedule(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteSchedule: ${data.id}`);

    await this.schedulesService.cancelSchedule(data.id);

    return {
      success: true,
      message: 'Schedule cancelled successfully',
    };
  }

  @GrpcMethod('PaymentService', 'GetDueSchedules')
  async getDueSchedules(data: GetDueSchedulesRequest): Promise<ScheduleListResponse> {
    this.logger.log(`GetDueSchedules for org: ${data.organisationId}`);

    const schedules = await this.schedulesService.getDueSchedules(
      data.organisationId,
      data.beforeDate,
    );

    return {
      schedules: schedules.map((s) => this.mapScheduleToResponse(s)),
      total: schedules.length,
    };
  }

  // ==================== PAYMENT INTENTS ====================

  @GrpcMethod('PaymentService', 'CreatePaymentIntent')
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    this.logger.log(`CreatePaymentIntent for societe: ${data.societeId}`);

    const provider = this.mapPspNameToProvider(data.pspName);

    const intent = await this.schedulesService.createPaymentIntent({
      scheduleId: data.scheduleId,
      clientId: '',
      societeId: data.societeId,
      provider,
      amount: data.amount / 100,
      currency: data.currency || 'EUR',
      metadata: data.metadata,
    });

    return this.mapPaymentIntentToResponse(intent);
  }

  @GrpcMethod('PaymentService', 'GetPaymentIntent')
  async getPaymentIntent(data: GetByIdRequest): Promise<PaymentIntentResponse> {
    this.logger.log(`GetPaymentIntent: ${data.id}`);

    const intent = await this.schedulesService.getPaymentIntentById(data.id);

    if (!intent) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Payment intent ${data.id} not found`,
      });
    }

    return this.mapPaymentIntentToResponse(intent);
  }

  @GrpcMethod('PaymentService', 'UpdatePaymentIntent')
  async updatePaymentIntent(data: UpdatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    this.logger.log(`UpdatePaymentIntent: ${data.id}`);

    const status = this.mapStatusStringToEnum(data.status ?? '');

    const intent = await this.schedulesService.updatePaymentIntentStatus(
      data.id,
      status,
      data.pspPaymentId,
      data.errorMessage,
    );

    if (status === PaymentIntentStatus.FAILED) {
      await this.handlePaymentRejection(intent, data);
    }

    return this.mapPaymentIntentToResponse(intent);
  }

  // ==================== PSP ACCOUNTS ====================

  @GrpcMethod('PaymentService', 'GetPSPAccountsSummary')
  async getPSPAccountsSummary(data: GetPSPAccountsRequest): Promise<PSPAccountsSummaryResponse> {
    this.logger.log(`GetPSPAccountsSummary for societe: ${data.societeId}`);

    const [stripeInfo, paypalInfo, gocardlessInfo, slimpayInfo, multisafepayInfo, emerchantpayInfo] = await Promise.all([
      this.stripeService.getAccountInfo(data.societeId),
      this.paypalService.getAccountInfo(data.societeId),
      this.goCardlessService.getAccountInfo(data.societeId),
      this.slimpayService.getAccountInfo(data.societeId),
      this.multisafepayService.getAccountInfo(data.societeId),
      this.emerchantpayService.getAccountInfo(data.societeId),
    ]);

    const stripeAccount = await this.stripeService.getAccountBySocieteId(data.societeId);
    const paypalAccount = await this.paypalService.getAccountBySocieteId(data.societeId);
    const gocardlessAccount = await this.goCardlessService.getAccountBySocieteId(data.societeId);
    const slimpayAccount = await this.slimpayService.getAccountBySocieteId(data.societeId);
    const multisafepayAccount = await this.multisafepayService.getAccountBySocieteId(data.societeId);
    const emerchantpayAccount = await this.emerchantpayService.getAccountBySocieteId(data.societeId);

    return {
      stripe: stripeAccount
        ? {
            id: stripeAccount.id,
            name: stripeAccount.nom,
            isActive: stripeAccount.actif,
            isLiveMode: stripeInfo.testMode === false,
            isConfigured: stripeInfo.configured,
          }
        : undefined,
      paypal: paypalAccount
        ? {
            id: paypalAccount.id,
            name: paypalAccount.nom,
            isActive: paypalAccount.actif,
            isLiveMode: paypalInfo.sandboxMode === false,
            isConfigured: paypalInfo.configured,
          }
        : undefined,
      gocardless: gocardlessAccount
        ? {
            id: gocardlessAccount.id,
            name: gocardlessAccount.nom,
            isActive: gocardlessAccount.actif,
            isLiveMode: gocardlessInfo.sandboxMode === false,
            isConfigured: gocardlessInfo.configured,
          }
        : undefined,
      emerchantpay: emerchantpayAccount
        ? {
            id: emerchantpayAccount.id,
            name: emerchantpayAccount.nom,
            isActive: emerchantpayAccount.actif,
            isLiveMode: emerchantpayInfo.testMode === false,
            isConfigured: emerchantpayInfo.configured,
          }
        : undefined,
      slimpay: slimpayAccount
        ? {
            id: slimpayAccount.id,
            name: slimpayAccount.nom,
            isActive: slimpayAccount.actif,
            isLiveMode: slimpayInfo.testMode === false,
            isConfigured: slimpayInfo.configured,
          }
        : undefined,
      multisafepay: multisafepayAccount
        ? {
            id: multisafepayAccount.id,
            name: multisafepayAccount.nom,
            isActive: multisafepayAccount.actif,
            isLiveMode: multisafepayInfo.testMode === false,
            isConfigured: multisafepayInfo.configured,
          }
        : undefined,
    };
  }

  // ==================== HELPERS ====================

  private mapScheduleToResponse(schedule: any): ScheduleResponse {
    return {
      id: schedule.id,
      organisationId: schedule.organisationId ?? '',
      societeId: schedule.societeId,
      contratId: schedule.contratId,
      factureId: schedule.factureId,
      clientId: schedule.clientId,
      amount: Math.round(schedule.amount * 100),
      currency: schedule.currency,
      dueDate: schedule.plannedDebitDate?.toISOString()
        || schedule.nextPaymentDate?.toISOString()
        || schedule.startDate?.toISOString()
        || '',
      status: schedule.status.toUpperCase(),
      lastAttemptAt: schedule.lastPaymentDate?.toISOString(),
      retryCount: schedule.retryCount ?? 0,
    };

  }

  private mapPaymentIntentToResponse(intent: any): PaymentIntentResponse {
    return {
      id: intent.id,
      organisationId: intent.metadata?.organisationId ?? '',
      societeId: intent.societeId,
      scheduleId: intent.scheduleId,
      pspName: intent.provider?.toUpperCase() || 'STRIPE',
      pspPaymentId: intent.providerPaymentId,
      amount: Math.round(intent.amount * 100),
      currency: intent.currency,
      status: intent.status.toUpperCase(),
      errorMessage: intent.failureReason,
      createdAt: intent.createdAt?.toISOString() || '',
      updatedAt: intent.updatedAt?.toISOString() || '',
    };

  }

  private async handlePaymentRejection(
    intent: any,
    data: UpdatePaymentIntentRequest,
  ): Promise<void> {
    const organisationId = intent.metadata?.organisationId;
    if (!organisationId) {
      return;
    }

    const scheduleId = intent.scheduleId ?? '';
    const clientId = intent.clientId ?? '';
    if (!scheduleId || !clientId) {
      return;
    }

    try {
      await this.retryClient.handlePaymentRejected({
        eventId: intent.id,
        organisationId,
        societeId: intent.societeId,
        paymentId: intent.id,
        scheduleId,
        clientId,
        reasonCode: data.errorCode ?? 'PAYMENT_FAILED',
        reasonMessage: data.errorMessage ?? intent.failureReason ?? 'Payment failed',
        amountCents: Math.round(intent.amount * 100),
        currency: intent.currency,
        pspName: intent.provider?.toUpperCase() || 'STRIPE',
        pspPaymentId: intent.providerPaymentId ?? undefined,
        rejectedAt: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
        eventTimestamp: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
        idempotencyKey: `${intent.id}:manual_failed`,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to enqueue retry schedule for payment ${intent.id}: ${error?.message ?? error}`,
      );
    }
  }

  private mapPspNameToProvider(pspName: string): PaymentProvider {
    const map: Record<string, PaymentProvider> = {
      STRIPE: PaymentProvider.STRIPE,
      PAYPAL: PaymentProvider.PAYPAL,
      GOCARDLESS: PaymentProvider.GOCARDLESS,
      SLIMPAY: PaymentProvider.SLIMPAY,
      MULTISAFEPAY: PaymentProvider.MULTISAFEPAY,
      EMERCHANTPAY: PaymentProvider.EMERCHANTPAY,
    };
    return map[pspName?.toUpperCase()] || PaymentProvider.STRIPE;
  }


  private mapStatusStringToEnum(status: string): PaymentIntentStatus {
    const map: Record<string, PaymentIntentStatus> = {
      PENDING: PaymentIntentStatus.PENDING,
      PROCESSING: PaymentIntentStatus.PROCESSING,
      SUCCEEDED: PaymentIntentStatus.SUCCEEDED,
      FAILED: PaymentIntentStatus.FAILED,
      CANCELLED: PaymentIntentStatus.CANCELLED,
      REFUNDED: PaymentIntentStatus.REFUNDED,
    };
    return map[status?.toUpperCase()] || PaymentIntentStatus.PENDING;
  }
}

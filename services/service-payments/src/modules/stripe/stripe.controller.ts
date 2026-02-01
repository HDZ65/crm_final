import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StripeService } from './stripe.service';
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
} from '@crm/proto/payments';

@Controller()
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  @GrpcMethod('PaymentService', 'CreateStripeCheckoutSession')
  async createStripeCheckoutSession(data: CreateStripeCheckoutSessionRequest): Promise<StripeCheckoutSessionResponse> {
    try {
      this.logger.log(`CreateStripeCheckoutSession for societe: ${data.societeId}`);

      const result = await this.stripeService.createCheckoutSession(data.societeId, {
        amount: data.amount / 100,
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
    } catch (e: unknown) {
      this.logger.error('CreateStripeCheckoutSession failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripePaymentIntent')
  async createStripePaymentIntent(data: CreateStripePaymentIntentRequest): Promise<StripePaymentIntentResponse> {
    try {
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
    } catch (e: unknown) {
      this.logger.error('CreateStripePaymentIntent failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripeCustomer')
  async createStripeCustomer(data: CreateStripeCustomerRequest): Promise<StripeCustomerResponse> {
    try {
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
    } catch (e: unknown) {
      this.logger.error('CreateStripeCustomer failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripeSubscription')
  async createStripeSubscription(data: CreateStripeSubscriptionRequest): Promise<StripeSubscriptionResponse> {
    try {
      this.logger.log(`CreateStripeSubscription for societe: ${data.societeId}`);

      const result = await this.stripeService.createSubscription(data.societeId, {
        customerId: data.customerId,
        priceId: data.priceId,
        metadata: data.metadata,
      });

      const subscription = result as unknown as { current_period_start?: number; current_period_end?: number };
      return {
        id: result.id,
        customerId: result.customer?.toString() ?? '',
        status: result.status,
        currentPeriodStart: subscription.current_period_start ?? 0,
        currentPeriodEnd: subscription.current_period_end ?? 0,
        cancelAtPeriodEnd: result.cancel_at_period_end,
      };
    } catch (e: unknown) {
      this.logger.error('CreateStripeSubscription failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CancelStripeSubscription')
  async cancelStripeSubscription(data: GetByIdRequest): Promise<StripeSubscriptionResponse> {
    try {
      this.logger.log(`CancelStripeSubscription: ${data.id}`);

      const result = await this.stripeService.cancelSubscription(data.societeId, data.id);

      const subscription = result as unknown as { current_period_start?: number; current_period_end?: number };
      return {
        id: result.id,
        customerId: result.customer?.toString() ?? '',
        status: result.status,
        currentPeriodStart: subscription.current_period_start ?? 0,
        currentPeriodEnd: subscription.current_period_end ?? 0,
        cancelAtPeriodEnd: result.cancel_at_period_end,
      };
    } catch (e: unknown) {
      this.logger.error('CancelStripeSubscription failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripeRefund')
  async createStripeRefund(data: CreateStripeRefundRequest): Promise<StripeRefundResponse> {
    try {
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
    } catch (e: unknown) {
      this.logger.error('CreateStripeRefund failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

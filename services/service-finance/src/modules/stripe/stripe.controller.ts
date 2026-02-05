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
      this.logger.log(`CreateStripeCheckoutSession for societe: ${data.societe_id}`);

      const result = await this.stripeService.createCheckoutSession(data.societe_id, {
        amount: data.amount / 100,
        currency: data.currency || 'eur',
        successUrl: data.success_url,
        cancelUrl: data.cancel_url,
        customerEmail: data.customer_email,
        clientReferenceId: data.customer_id,
        metadata: data.metadata,
      });

      return {
        id: result.sessionId,
        url: result.sessionUrl,
        status: 'open',
        payment_status: 'unpaid',
      };
    } catch (e: unknown) {
      this.logger.error('CreateStripeCheckoutSession failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripePaymentIntent')
  async createStripePaymentIntent(data: CreateStripePaymentIntentRequest): Promise<StripePaymentIntentResponse> {
    try {
      this.logger.log(`CreateStripePaymentIntent for societe: ${data.societe_id}`);

      const result = await this.stripeService.createPaymentIntent(data.societe_id, {
        amount: data.amount / 100,
        currency: data.currency || 'eur',
        customerId: data.customer_id,
        paymentMethodId: data.payment_method,
        metadata: data.metadata,
        confirm: data.confirm,
      });

      return {
        id: result.id,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        client_secret: result.client_secret ?? undefined,
        customer_id: result.customer?.toString(),
        payment_method: result.payment_method?.toString(),
      };
    } catch (e: unknown) {
      this.logger.error('CreateStripePaymentIntent failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripeCustomer')
  async createStripeCustomer(data: CreateStripeCustomerRequest): Promise<StripeCustomerResponse> {
    try {
      this.logger.log(`CreateStripeCustomer for societe: ${data.societe_id}`);

      const result = await this.stripeService.createCustomer(data.societe_id, {
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
      this.logger.log(`CreateStripeSubscription for societe: ${data.societe_id}`);

      const result = await this.stripeService.createSubscription(data.societe_id, {
        customerId: data.customer_id,
        priceId: data.price_id,
        metadata: data.metadata,
      });

      const subscription = result as unknown as { current_period_start?: number; current_period_end?: number };
      return {
        id: result.id,
        customer_id: result.customer?.toString() ?? '',
        status: result.status,
        current_period_start: subscription.current_period_start ?? 0,
        current_period_end: subscription.current_period_end ?? 0,
        cancel_at_period_end: result.cancel_at_period_end,
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

      const result = await this.stripeService.cancelSubscription(data.societe_id, data.id);

      const subscription = result as unknown as { current_period_start?: number; current_period_end?: number };
      return {
        id: result.id,
        customer_id: result.customer?.toString() ?? '',
        status: result.status,
        current_period_start: subscription.current_period_start ?? 0,
        current_period_end: subscription.current_period_end ?? 0,
        cancel_at_period_end: result.cancel_at_period_end,
      };
    } catch (e: unknown) {
      this.logger.error('CancelStripeSubscription failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateStripeRefund')
  async createStripeRefund(data: CreateStripeRefundRequest): Promise<StripeRefundResponse> {
    try {
      this.logger.log(`CreateStripeRefund for payment: ${data.payment_intent_id}`);

      const result = await this.stripeService.createRefund(data.societe_id, {
        paymentIntentId: data.payment_intent_id,
        amount: data.amount ? data.amount / 100 : undefined,
        reason: data.reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
      });

      return {
        id: result.id,
        amount: result.amount,
        currency: result.currency,
        status: result.status ?? '',
        payment_intent_id: result.payment_intent?.toString() ?? '',
      };
    } catch (e: unknown) {
      this.logger.error('CreateStripeRefund failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  StripeApiService,
  StripePaymentIntentParams,
  StripeCheckoutSessionParams,
  StripeCustomerParams,
  StripeSubscriptionParams,
  StripeRefundParams,
  StripeSetupIntentParams,
  StripeBillingPortalParams,
} from '../../../../infrastructure/psp/stripe/stripe-api.service';

// ─── Request/Response interfaces (matching proto messages) ──

interface CreateStripePaymentIntentRequest {
  societe_id: string;
  amount: number;
  currency: string;
  customer_id?: string;
  description?: string;
  payment_method?: string;
  confirm: boolean;
  automatic_payment_methods: boolean;
  metadata?: Record<string, string>;
}

interface StripePaymentIntentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
  customer_id?: string;
  payment_method?: string;
}

interface GetByIdRequest {
  id: string;
  societe_id: string;
}

interface CreateStripeCheckoutSessionRequest {
  societe_id: string;
  amount: number;
  currency: string;
  mode: string;
  success_url: string;
  cancel_url: string;
  customer_id?: string;
  customer_email?: string;
  price_id?: string;
  metadata?: Record<string, string>;
  line_items?: Array<{
    name: string;
    description: string;
    amount: number;
    quantity: number;
    currency: string;
  }>;
}

interface StripeCheckoutSessionResponse {
  id: string;
  url: string;
  status: string;
  payment_status: string;
  customer_id?: string;
  subscription_id?: string;
}

interface CreateStripeCustomerRequest {
  societe_id: string;
  email: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface StripeCustomerResponse {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  created: number;
}

interface CreateStripeSubscriptionRequest {
  societe_id: string;
  customer_id: string;
  price_id: string;
  payment_method?: string;
  default_payment_method?: string;
  metadata?: Record<string, string>;
}

interface StripeSubscriptionResponse {
  id: string;
  customer_id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

interface CreateStripeRefundRequest {
  societe_id: string;
  payment_intent_id: string;
  amount?: number;
  reason?: string;
}

interface StripeRefundResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_intent_id: string;
}

interface CreateStripeSetupIntentRequest {
  societe_id: string;
  customer_id?: string;
  payment_method_types?: string[];
  metadata?: Record<string, string>;
}

interface StripeSetupIntentResponse {
  id: string;
  client_secret: string;
  status: string;
  customer_id?: string;
  payment_method?: string;
}

interface CreateStripeBillingPortalRequest {
  societe_id: string;
  customer_id: string;
  return_url: string;
}

interface StripeBillingPortalResponse {
  id: string;
  url: string;
}

// ─── Controller ─────────────────────────────────────────────

@Controller()
export class StripeController {
  constructor(private readonly stripeApi: StripeApiService) {}

  // -----------------------------------------------------------------------
  // Checkout & Payment Intents
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateStripeCheckoutSession')
  async createCheckoutSession(
    data: CreateStripeCheckoutSessionRequest,
  ): Promise<StripeCheckoutSessionResponse> {
    const params: StripeCheckoutSessionParams = {
      societeId: data.societe_id,
      amount: Number(data.amount),
      currency: data.currency,
      mode: data.mode,
      successUrl: data.success_url,
      cancelUrl: data.cancel_url,
      customerId: data.customer_id ?? undefined,
      customerEmail: data.customer_email ?? undefined,
      priceId: data.price_id ?? undefined,
      metadata: data.metadata ?? {},
      lineItems: data.line_items,
    };

    const result = await this.stripeApi.createCheckoutSession(params);

    return {
      id: result.id,
      url: result.url,
      status: result.status,
      payment_status: result.paymentStatus,
      customer_id: result.customerId,
      subscription_id: result.subscriptionId,
    };
  }

  @GrpcMethod('PaymentService', 'CreateStripePaymentIntent')
  async createPaymentIntent(
    data: CreateStripePaymentIntentRequest,
  ): Promise<StripePaymentIntentResponse> {
    const params: StripePaymentIntentParams = {
      societeId: data.societe_id,
      amount: Number(data.amount),
      currency: data.currency,
      customerId: data.customer_id ?? undefined,
      description: data.description ?? undefined,
      paymentMethod: data.payment_method ?? undefined,
      confirm: data.confirm,
      automaticPaymentMethods: data.automatic_payment_methods,
      metadata: data.metadata ?? {},
    };

    const result = await this.stripeApi.createPaymentIntent(params);

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      client_secret: result.clientSecret,
      customer_id: result.customerId,
      payment_method: result.paymentMethod,
    };
  }

  @GrpcMethod('PaymentService', 'GetStripePaymentIntent')
  async getPaymentIntent(data: GetByIdRequest): Promise<StripePaymentIntentResponse> {
    const result = await this.stripeApi.getPaymentIntent(data.id, data.societe_id);

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      client_secret: result.clientSecret,
      customer_id: result.customerId,
      payment_method: result.paymentMethod,
    };
  }

  @GrpcMethod('PaymentService', 'CancelStripePaymentIntent')
  async cancelPaymentIntent(data: GetByIdRequest): Promise<StripePaymentIntentResponse> {
    const result = await this.stripeApi.cancelPaymentIntent(data.id, data.societe_id);

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      client_secret: result.clientSecret,
      customer_id: result.customerId,
      payment_method: result.paymentMethod,
    };
  }

  // -----------------------------------------------------------------------
  // Customers
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateStripeCustomer')
  async createCustomer(data: CreateStripeCustomerRequest): Promise<StripeCustomerResponse> {
    const params: StripeCustomerParams = {
      societeId: data.societe_id,
      email: data.email,
      name: data.name ?? undefined,
      phone: data.phone ?? undefined,
      description: data.description ?? undefined,
      metadata: data.metadata ?? {},
    };

    const result = await this.stripeApi.createCustomer(params);

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      phone: result.phone,
      created: result.created,
    };
  }

  @GrpcMethod('PaymentService', 'GetStripeCustomer')
  async getCustomer(data: GetByIdRequest): Promise<StripeCustomerResponse> {
    const result = await this.stripeApi.getCustomer(data.id, data.societe_id);

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      phone: result.phone,
      created: result.created,
    };
  }

  // -----------------------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateStripeSubscription')
  async createSubscription(
    data: CreateStripeSubscriptionRequest,
  ): Promise<StripeSubscriptionResponse> {
    const params: StripeSubscriptionParams = {
      societeId: data.societe_id,
      customerId: data.customer_id,
      priceId: data.price_id,
      paymentMethod: data.payment_method ?? undefined,
      defaultPaymentMethod: data.default_payment_method ?? undefined,
      metadata: data.metadata ?? {},
    };

    const result = await this.stripeApi.createSubscription(params);

    return {
      id: result.id,
      customer_id: result.customerId,
      status: result.status,
      current_period_start: result.currentPeriodStart,
      current_period_end: result.currentPeriodEnd,
      cancel_at_period_end: result.cancelAtPeriodEnd,
    };
  }

  @GrpcMethod('PaymentService', 'GetStripeSubscription')
  async getSubscription(data: GetByIdRequest): Promise<StripeSubscriptionResponse> {
    const result = await this.stripeApi.getSubscription(data.id, data.societe_id);

    return {
      id: result.id,
      customer_id: result.customerId,
      status: result.status,
      current_period_start: result.currentPeriodStart,
      current_period_end: result.currentPeriodEnd,
      cancel_at_period_end: result.cancelAtPeriodEnd,
    };
  }

  @GrpcMethod('PaymentService', 'CancelStripeSubscription')
  async cancelSubscription(data: GetByIdRequest): Promise<StripeSubscriptionResponse> {
    const result = await this.stripeApi.cancelSubscription(data.id, data.societe_id);

    return {
      id: result.id,
      customer_id: result.customerId,
      status: result.status,
      current_period_start: result.currentPeriodStart,
      current_period_end: result.currentPeriodEnd,
      cancel_at_period_end: result.cancelAtPeriodEnd,
    };
  }

  // -----------------------------------------------------------------------
  // Refunds
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateStripeRefund')
  async createRefund(data: CreateStripeRefundRequest): Promise<StripeRefundResponse> {
    const params: StripeRefundParams = {
      societeId: data.societe_id,
      paymentIntentId: data.payment_intent_id,
      amount: data.amount ? Number(data.amount) : undefined,
      reason: data.reason ?? undefined,
    };

    const result = await this.stripeApi.createRefund(params);

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      payment_intent_id: result.paymentIntentId,
    };
  }

  // -----------------------------------------------------------------------
  // Setup Intents
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateStripeSetupIntent')
  async createSetupIntent(
    data: CreateStripeSetupIntentRequest,
  ): Promise<StripeSetupIntentResponse> {
    const params: StripeSetupIntentParams = {
      societeId: data.societe_id,
      customerId: data.customer_id ?? undefined,
      paymentMethodTypes: data.payment_method_types ?? undefined,
      metadata: data.metadata ?? {},
    };

    const result = await this.stripeApi.createSetupIntent(params);

    return {
      id: result.id,
      client_secret: result.clientSecret,
      status: result.status,
      customer_id: result.customerId,
      payment_method: result.paymentMethod,
    };
  }

  // -----------------------------------------------------------------------
  // Billing Portal
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateStripeBillingPortalSession')
  async createBillingPortalSession(
    data: CreateStripeBillingPortalRequest,
  ): Promise<StripeBillingPortalResponse> {
    const params: StripeBillingPortalParams = {
      societeId: data.societe_id,
      customerId: data.customer_id,
      returnUrl: data.return_url,
    };

    const result = await this.stripeApi.createBillingPortalSession(params);

    return {
      id: result.id,
      url: result.url,
    };
  }
}

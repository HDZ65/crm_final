import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import {
  StripeAccountEntity,
  PaymentEventEntity,
  PaymentEventType,
  PaymentProvider,
} from '../../../domain/payments/entities';
import { EncryptionService } from '../../security/encryption.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StripePaymentIntentParams {
  societeId: string;
  amount: number; // in cents
  currency: string;
  customerId?: string;
  description?: string;
  paymentMethod?: string;
  confirm?: boolean;
  automaticPaymentMethods?: boolean;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentResult {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  customerId?: string;
  paymentMethod?: string;
}

export interface StripeCheckoutSessionParams {
  societeId: string;
  amount: number;
  currency: string;
  mode: string; // 'payment' | 'subscription' | 'setup'
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

export interface StripeCheckoutSessionResult {
  id: string;
  url: string;
  status: string;
  paymentStatus: string;
  customerId?: string;
  subscriptionId?: string;
}

export interface StripeCustomerParams {
  societeId: string;
  email: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface StripeCustomerResult {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  created: number;
}

export interface StripeSubscriptionParams {
  societeId: string;
  customerId: string;
  priceId: string;
  paymentMethod?: string;
  defaultPaymentMethod?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscriptionResult {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface StripeRefundParams {
  societeId: string;
  paymentIntentId: string;
  amount?: number; // partial refund in cents, omit for full
  reason?: string;
}

export interface StripeRefundResult {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentIntentId: string;
}

export interface StripeSetupIntentParams {
  societeId: string;
  customerId?: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
}

export interface StripeSetupIntentResult {
  id: string;
  clientSecret: string;
  status: string;
  customerId?: string;
  paymentMethod?: string;
}

export interface StripeBillingPortalParams {
  societeId: string;
  customerId: string;
  returnUrl: string;
}

export interface StripeBillingPortalResult {
  id: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class StripeApiService {
  private readonly logger = new Logger(StripeApiService.name);

  /** In-memory cache of Stripe SDK instances by societeId. */
  private readonly stripeInstances = new Map<string, Stripe>();

  constructor(
    @InjectRepository(StripeAccountEntity)
    private readonly stripeAccountRepo: Repository<StripeAccountEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  // -----------------------------------------------------------------------
  // Stripe SDK instance management
  // -----------------------------------------------------------------------

  private async getStripeInstance(societeId: string): Promise<Stripe> {
    const cached = this.stripeInstances.get(societeId);
    if (cached) {
      return cached;
    }

    const account = await this.getAccount(societeId);
    const secretKey = this.encryptionService.decrypt(account.stripeSecretKey);

    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    });

    this.stripeInstances.set(societeId, stripe);
    return stripe;
  }

  // -----------------------------------------------------------------------
  // Account retrieval
  // -----------------------------------------------------------------------

  async getAccount(societeId: string): Promise<StripeAccountEntity> {
    const account = await this.stripeAccountRepo.findOne({
      where: { societeId, actif: true },
    });

    if (!account) {
      throw new Error(`No active Stripe account found for societeId ${societeId}`);
    }

    if (!account.isConfigured()) {
      throw new Error(`Stripe account ${account.id} is not fully configured`);
    }

    return account;
  }

  // -----------------------------------------------------------------------
  // Payment Intent operations
  // -----------------------------------------------------------------------

  async createPaymentIntent(params: StripePaymentIntentParams): Promise<StripePaymentIntentResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createPaymentIntent', {
      amount: params.amount,
      currency: params.currency,
    });

    try {
      const createParams: Stripe.PaymentIntentCreateParams = {
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata ?? {},
      };

      if (params.customerId) {
        createParams.customer = params.customerId;
      }
      if (params.description) {
        createParams.description = params.description;
      }
      if (params.paymentMethod) {
        createParams.payment_method = params.paymentMethod;
      }
      if (params.confirm !== undefined) {
        createParams.confirm = params.confirm;
      }
      if (params.automaticPaymentMethods) {
        createParams.automatic_payment_methods = { enabled: true };
      }

      const pi = await stripe.paymentIntents.create(createParams);

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createPaymentIntent', {
        id: pi.id,
        status: pi.status,
      });

      return {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        clientSecret: pi.client_secret ?? undefined,
        customerId: typeof pi.customer === 'string' ? pi.customer : pi.customer?.id,
        paymentMethod: typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id,
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createPaymentIntent', null, error);
      throw this.mapError('createPaymentIntent', error);
    }
  }

  async getPaymentIntent(paymentIntentId: string, societeId: string): Promise<StripePaymentIntentResult> {
    const stripe = await this.getStripeInstance(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'getPaymentIntent', { paymentIntentId });

    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

      await this.logApiEvent(societeId, 'API_RESPONSE', 'getPaymentIntent', {
        id: pi.id,
        status: pi.status,
      });

      return {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        clientSecret: pi.client_secret ?? undefined,
        customerId: typeof pi.customer === 'string' ? pi.customer : pi.customer?.id,
        paymentMethod: typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getPaymentIntent', null, error);
      throw this.mapError('getPaymentIntent', error);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string, societeId: string): Promise<StripePaymentIntentResult> {
    const stripe = await this.getStripeInstance(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'cancelPaymentIntent', { paymentIntentId });

    try {
      const pi = await stripe.paymentIntents.cancel(paymentIntentId);

      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelPaymentIntent', {
        id: pi.id,
        status: pi.status,
      });

      return {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        clientSecret: pi.client_secret ?? undefined,
        customerId: typeof pi.customer === 'string' ? pi.customer : pi.customer?.id,
        paymentMethod: typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelPaymentIntent', null, error);
      throw this.mapError('cancelPaymentIntent', error);
    }
  }

  // -----------------------------------------------------------------------
  // Checkout Session operations
  // -----------------------------------------------------------------------

  async createCheckoutSession(params: StripeCheckoutSessionParams): Promise<StripeCheckoutSessionResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createCheckoutSession', {
      mode: params.mode,
      amount: params.amount,
    });

    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: params.mode as Stripe.Checkout.SessionCreateParams.Mode,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata ?? {},
      };

      if (params.customerId) {
        sessionParams.customer = params.customerId;
      }
      if (params.customerEmail && !params.customerId) {
        sessionParams.customer_email = params.customerEmail;
      }

      // Build line items from params or from priceId
      if (params.lineItems && params.lineItems.length > 0) {
        sessionParams.line_items = params.lineItems.map((item) => ({
          price_data: {
            currency: item.currency,
            product_data: {
              name: item.name,
              description: item.description || undefined,
            },
            unit_amount: item.amount,
          },
          quantity: item.quantity,
        }));
      } else if (params.priceId) {
        sessionParams.line_items = [{ price: params.priceId, quantity: 1 }];
      } else if (params.mode === 'payment') {
        sessionParams.line_items = [
          {
            price_data: {
              currency: params.currency,
              product_data: { name: 'Payment' },
              unit_amount: params.amount,
            },
            quantity: 1,
          },
        ];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createCheckoutSession', {
        id: session.id,
        status: session.status,
      });

      return {
        id: session.id,
        url: session.url ?? '',
        status: session.status ?? '',
        paymentStatus: session.payment_status,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        subscriptionId: typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id,
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createCheckoutSession', null, error);
      throw this.mapError('createCheckoutSession', error);
    }
  }

  // -----------------------------------------------------------------------
  // Customer operations
  // -----------------------------------------------------------------------

  async createCustomer(params: StripeCustomerParams): Promise<StripeCustomerResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createCustomer', {
      email: params.email,
    });

    try {
      const createParams: Stripe.CustomerCreateParams = {
        email: params.email,
        metadata: params.metadata ?? {},
      };

      if (params.name) {
        createParams.name = params.name;
      }
      if (params.phone) {
        createParams.phone = params.phone;
      }
      if (params.description) {
        createParams.description = params.description;
      }

      const customer = await stripe.customers.create(createParams);

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createCustomer', {
        id: customer.id,
      });

      return {
        id: customer.id,
        email: customer.email ?? params.email,
        name: customer.name ?? undefined,
        phone: customer.phone ?? undefined,
        created: customer.created,
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createCustomer', null, error);
      throw this.mapError('createCustomer', error);
    }
  }

  async getCustomer(customerId: string, societeId: string): Promise<StripeCustomerResult> {
    const stripe = await this.getStripeInstance(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'getCustomer', { customerId });

    try {
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new Error(`Stripe customer ${customerId} has been deleted`);
      }

      await this.logApiEvent(societeId, 'API_RESPONSE', 'getCustomer', { id: customer.id });

      return {
        id: customer.id,
        email: customer.email ?? '',
        name: customer.name ?? undefined,
        phone: customer.phone ?? undefined,
        created: customer.created,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getCustomer', null, error);
      throw this.mapError('getCustomer', error);
    }
  }

  // -----------------------------------------------------------------------
  // Subscription operations
  // -----------------------------------------------------------------------

  async createSubscription(params: StripeSubscriptionParams): Promise<StripeSubscriptionResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createSubscription', {
      customerId: params.customerId,
      priceId: params.priceId,
    });

    try {
      const subParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata ?? {},
      };

      if (params.defaultPaymentMethod) {
        subParams.default_payment_method = params.defaultPaymentMethod;
      }

      const subscription = await stripe.subscriptions.create(subParams);
      const subData = subscription as any;

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createSubscription', {
        id: subscription.id,
        status: subscription.status,
      });

      return {
        id: subscription.id,
        customerId: typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
        status: subscription.status,
        currentPeriodStart: subData.current_period_start ?? 0,
        currentPeriodEnd: subData.current_period_end ?? 0,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createSubscription', null, error);
      throw this.mapError('createSubscription', error);
    }
  }

  async getSubscription(subscriptionId: string, societeId: string): Promise<StripeSubscriptionResult> {
    const stripe = await this.getStripeInstance(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'getSubscription', { subscriptionId });

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subData = subscription as any;

      await this.logApiEvent(societeId, 'API_RESPONSE', 'getSubscription', {
        id: subscription.id,
        status: subscription.status,
      });

      return {
        id: subscription.id,
        customerId: typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
        status: subscription.status,
        currentPeriodStart: subData.current_period_start ?? 0,
        currentPeriodEnd: subData.current_period_end ?? 0,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getSubscription', null, error);
      throw this.mapError('getSubscription', error);
    }
  }

  async cancelSubscription(subscriptionId: string, societeId: string): Promise<StripeSubscriptionResult> {
    const stripe = await this.getStripeInstance(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'cancelSubscription', { subscriptionId });

    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      const subData = subscription as any;

      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelSubscription', {
        id: subscription.id,
        status: subscription.status,
      });

      return {
        id: subscription.id,
        customerId: typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
        status: subscription.status,
        currentPeriodStart: subData.current_period_start ?? 0,
        currentPeriodEnd: subData.current_period_end ?? 0,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelSubscription', null, error);
      throw this.mapError('cancelSubscription', error);
    }
  }

  // -----------------------------------------------------------------------
  // Refund operations
  // -----------------------------------------------------------------------

  async createRefund(params: StripeRefundParams): Promise<StripeRefundResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createRefund', {
      paymentIntentId: params.paymentIntentId,
      amount: params.amount,
    });

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
      };

      if (params.amount !== undefined) {
        refundParams.amount = params.amount;
      }
      if (params.reason) {
        refundParams.reason = params.reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await stripe.refunds.create(refundParams);

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createRefund', {
        id: refund.id,
        status: refund.status,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status ?? '',
        paymentIntentId: typeof refund.payment_intent === 'string'
          ? refund.payment_intent
          : refund.payment_intent?.id ?? '',
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createRefund', null, error);
      throw this.mapError('createRefund', error);
    }
  }

  // -----------------------------------------------------------------------
  // Setup Intent operations
  // -----------------------------------------------------------------------

  async createSetupIntent(params: StripeSetupIntentParams): Promise<StripeSetupIntentResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createSetupIntent', {
      customerId: params.customerId,
    });

    try {
      const siParams: Stripe.SetupIntentCreateParams = {
        metadata: params.metadata ?? {},
      };

      if (params.customerId) {
        siParams.customer = params.customerId;
      }
      if (params.paymentMethodTypes && params.paymentMethodTypes.length > 0) {
        siParams.payment_method_types = params.paymentMethodTypes;
      }

      const si = await stripe.setupIntents.create(siParams);

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createSetupIntent', {
        id: si.id,
        status: si.status,
      });

      return {
        id: si.id,
        clientSecret: si.client_secret ?? '',
        status: si.status,
        customerId: typeof si.customer === 'string' ? si.customer : si.customer?.id,
        paymentMethod: typeof si.payment_method === 'string' ? si.payment_method : si.payment_method?.id,
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createSetupIntent', null, error);
      throw this.mapError('createSetupIntent', error);
    }
  }

  // -----------------------------------------------------------------------
  // Billing Portal operations
  // -----------------------------------------------------------------------

  async createBillingPortalSession(params: StripeBillingPortalParams): Promise<StripeBillingPortalResult> {
    const stripe = await this.getStripeInstance(params.societeId);

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createBillingPortalSession', {
      customerId: params.customerId,
    });

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createBillingPortalSession', {
        id: session.id,
      });

      return {
        id: session.id,
        url: session.url,
      };
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createBillingPortalSession', null, error);
      throw this.mapError('createBillingPortalSession', error);
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async logApiEvent(
    societeId: string,
    direction: string,
    operation: string,
    payload: Record<string, any> | null,
    error?: unknown,
  ): Promise<void> {
    try {
      const event = new PaymentEventEntity();
      event.societeId = societeId;
      event.provider = PaymentProvider.STRIPE;
      event.eventType =
        direction === 'API_REQUEST'
          ? PaymentEventType.WEBHOOK_RECEIVED
          : PaymentEventType.WEBHOOK_PROCESSED;
      event.payload = {
        direction,
        operation,
        data: payload,
        ...(error ? { error: String(error) } : {}),
      };
      event.processed = true;

      await this.paymentEventRepo.save(event);
    } catch (logError) {
      this.logger.error(`Failed to log API event: ${logError}`);
    }
  }

  private mapError(operation: string, error: unknown): Error {
    if (error instanceof Stripe.errors.StripeError) {
      const message = `Stripe ${operation} failed: [${error.type}] ${error.message}`;
      this.logger.error(message);
      return new Error(message);
    }
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Stripe ${operation} failed: ${message}`);
    return new Error(`Stripe ${operation} failed: ${message}`);
  }
}

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { StripeAccountRepositoryPort } from '../../../core/port/stripe-account-repository.port';

export interface CreateCheckoutSessionParams {
  societeId?: string; // For multi-account support
  customerId?: string;
  customerEmail?: string;
  priceId?: string;
  amount?: number;
  currency?: string;
  mode: 'payment' | 'subscription' | 'setup';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    priceId?: string;
    quantity: number;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    interval?: 'day' | 'week' | 'month' | 'year'; // For subscriptions without priceId
  }>;
}

export interface CreatePaymentIntentParams {
  societeId?: string; // For multi-account support
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
  receiptEmail?: string;
  automaticPaymentMethods?: boolean;
}

export interface CreateCustomerParams {
  societeId?: string; // For multi-account support
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface CreateSubscriptionParams {
  societeId?: string; // For multi-account support
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
  paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'allow_incomplete';
}

export interface CreateProductParams {
  societeId?: string; // For multi-account support
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePriceParams {
  societeId?: string; // For multi-account support
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
  };
  metadata?: Record<string, string>;
}

export interface CreateSetupIntentParams {
  societeId?: string; // For multi-account support
  customerId?: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
  usage?: 'on_session' | 'off_session';
  description?: string;
}

export interface CreateBillingPortalSessionParams {
  societeId?: string; // For multi-account support
  customerId: string;
  returnUrl: string;
  configuration?: string;
}

@Injectable()
export class StripeService {
  private readonly defaultStripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);

  // Cache for Stripe instances per societe (multi-account support)
  private readonly stripeInstances: Map<string, Stripe> = new Map();
  private readonly webhookSecrets: Map<string, string> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @Inject('StripeAccountRepositoryPort')
    private readonly stripeAccountRepository: StripeAccountRepositoryPort,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe features disabled (use per-societe accounts)');
      this.defaultStripe = null;
    } else {
      this.defaultStripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
      });
    }
  }

  /**
   * Get Stripe instance for a specific societe (multi-account)
   * Falls back to default Stripe if no societe-specific account exists
   */
  async getStripeForSociete(societeId?: string): Promise<Stripe> {
    // If no societeId provided, use default
    if (!societeId) {
      return this.ensureStripeConfigured();
    }

    // Check cache first
    if (this.stripeInstances.has(societeId)) {
      return this.stripeInstances.get(societeId)!;
    }

    // Look up account in database
    const account = await this.stripeAccountRepository.findBySocieteId(societeId);

    if (!account || !account.actif) {
      this.logger.warn(`No active Stripe account for societe ${societeId}, using default`);
      return this.ensureStripeConfigured();
    }

    // Create new Stripe instance with societe-specific credentials
    const stripe = new Stripe(account.stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });

    // Cache the instance
    this.stripeInstances.set(societeId, stripe);

    // Cache webhook secret if available
    if (account.stripeWebhookSecret) {
      this.webhookSecrets.set(societeId, account.stripeWebhookSecret);
    }

    this.logger.log(`Created Stripe instance for societe ${societeId} (${account.nom})`);
    return stripe;
  }

  /**
   * Get webhook secret for a specific societe
   */
  async getWebhookSecretForSociete(societeId?: string): Promise<string> {
    // Use default if no societeId
    if (!societeId) {
      const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!secret) {
        throw new Error('No webhook secret configured');
      }
      return secret;
    }

    // Check cache
    if (this.webhookSecrets.has(societeId)) {
      return this.webhookSecrets.get(societeId)!;
    }

    // Look up in database
    const account = await this.stripeAccountRepository.findBySocieteId(societeId);
    if (!account?.stripeWebhookSecret) {
      throw new Error(`No webhook secret configured for societe ${societeId}`);
    }

    // Cache and return
    this.webhookSecrets.set(societeId, account.stripeWebhookSecret);
    return account.stripeWebhookSecret;
  }

  /**
   * Clear cached Stripe instance for a societe (call after credential update)
   */
  clearCacheForSociete(societeId: string): void {
    this.stripeInstances.delete(societeId);
    this.webhookSecrets.delete(societeId);
    this.logger.log(`Cleared Stripe cache for societe ${societeId}`);
  }

  /**
   * Clear all cached instances
   */
  clearAllCaches(): void {
    this.stripeInstances.clear();
    this.webhookSecrets.clear();
    this.logger.log('Cleared all Stripe caches');
  }

  private ensureStripeConfigured(): Stripe {
    if (!this.defaultStripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable or configure a societe-specific account.');
    }
    return this.defaultStripe;
  }

  // Legacy getter - kept for backward compatibility, prefer getStripeForSociete
  private get stripe(): Stripe | null {
    return this.defaultStripe;
  }

  /**
   * Create a Checkout Session for hosted payment page
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<Stripe.Checkout.Session> {
    const stripe = await this.getStripeForSociete(params.societeId);

    // For subscriptions, we need to create prices in Stripe first if not provided
    const lineItems = await this.buildLineItemsAsync(params, stripe);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      line_items: lineItems,
      metadata: params.metadata,
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    this.logger.log(`Checkout session created: ${session.id}`);
    return session;
  }

  /**
   * Create a PaymentIntent for custom payment flow
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      description: params.description,
      receipt_email: params.receiptEmail,
    };

    if (params.customerId) {
      paymentIntentParams.customer = params.customerId;
    }

    if (params.automaticPaymentMethods !== false) {
      paymentIntentParams.automatic_payment_methods = { enabled: true };
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
    return paymentIntent;
  }

  /**
   * Confirm a PaymentIntent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
    societeId?: string,
  ): Promise<Stripe.PaymentIntent> {
    const params: Stripe.PaymentIntentConfirmParams = {};
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.paymentIntents.confirm(paymentIntentId, params);
  }

  /**
   * Retrieve a PaymentIntent
   */
  async retrievePaymentIntent(
    paymentIntentId: string,
    societeId?: string,
  ): Promise<Stripe.PaymentIntent> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Cancel a PaymentIntent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
    reason?: Stripe.PaymentIntentCancelParams.CancellationReason,
    societeId?: string,
  ): Promise<Stripe.PaymentIntent> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: reason,
    });
  }

  /**
   * Create a Stripe Customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    const customerParams: Stripe.CustomerCreateParams = {
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    };

    if (params.address) {
      customerParams.address = {
        line1: params.address.line1,
        line2: params.address.line2,
        city: params.address.city,
        state: params.address.state,
        postal_code: params.address.postalCode,
        country: params.address.country,
      };
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    const customer = await stripe.customers.create(customerParams);
    this.logger.log(`Customer created: ${customer.id}`);
    return customer;
  }

  /**
   * Retrieve a Customer
   */
  async retrieveCustomer(customerId: string, societeId?: string): Promise<Stripe.Customer> {
    const stripe = await this.getStripeForSociete(societeId);
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error(`Customer ${customerId} has been deleted`);
    }
    return customer as Stripe.Customer;
  }

  /**
   * Update a Customer
   */
  async updateCustomer(
    customerId: string,
    params: Partial<CreateCustomerParams>,
  ): Promise<Stripe.Customer> {
    const updateParams: Stripe.CustomerUpdateParams = {
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    };

    if (params.address) {
      updateParams.address = {
        line1: params.address.line1,
        line2: params.address.line2,
        city: params.address.city,
        state: params.address.state,
        postal_code: params.address.postalCode,
        country: params.address.country,
      };
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    return stripe.customers.update(customerId, updateParams);
  }

  /**
   * Create a Subscription
   */
  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<Stripe.Subscription> {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
      payment_behavior: params.paymentBehavior || 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    };

    if (params.trialPeriodDays) {
      subscriptionParams.trial_period_days = params.trialPeriodDays;
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    const subscription = await stripe.subscriptions.create(subscriptionParams);
    this.logger.log(`Subscription created: ${subscription.id}`);
    return subscription;
  }

  /**
   * Retrieve a Subscription
   */
  async retrieveSubscription(
    subscriptionId: string,
    societeId?: string,
  ): Promise<Stripe.Subscription> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel a Subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
    societeId?: string,
  ): Promise<Stripe.Subscription> {
    const stripe = await this.getStripeForSociete(societeId);
    if (immediately) {
      return stripe.subscriptions.cancel(subscriptionId);
    }
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * List Payment Methods for a Customer
   */
  async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card',
    societeId?: string,
  ): Promise<Stripe.PaymentMethod[]> {
    const stripe = await this.getStripeForSociete(societeId);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });
    return paymentMethods.data;
  }

  /**
   * Attach Payment Method to Customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
    societeId?: string,
  ): Promise<Stripe.PaymentMethod> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Set Default Payment Method for Customer
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    societeId?: string,
  ): Promise<Stripe.Customer> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  /**
   * Create a Refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason,
    societeId?: string,
  ): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason,
    };
    if (amount) {
      refundParams.amount = amount;
    }
    const stripe = await this.getStripeForSociete(societeId);
    const refund = await stripe.refunds.create(refundParams);
    this.logger.log(`Refund created: ${refund.id}`);
    return refund;
  }

  /**
   * Create a Product
   */
  async createProduct(params: CreateProductParams): Promise<Stripe.Product> {
    const productParams: Stripe.ProductCreateParams = {
      name: params.name,
      description: params.description,
      metadata: params.metadata,
    };

    const stripe = await this.getStripeForSociete(params.societeId);
    const product = await stripe.products.create(productParams);
    this.logger.log(`Product created: ${product.id}`);
    return product;
  }

  /**
   * Create a Price for a Product
   */
  async createPrice(params: CreatePriceParams): Promise<Stripe.Price> {
    const priceParams: Stripe.PriceCreateParams = {
      product: params.productId,
      unit_amount: params.unitAmount,
      currency: params.currency,
      metadata: params.metadata,
    };

    if (params.recurring) {
      priceParams.recurring = {
        interval: params.recurring.interval,
        interval_count: params.recurring.intervalCount,
      };
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    const price = await stripe.prices.create(priceParams);
    this.logger.log(`Price created: ${price.id}`);
    return price;
  }

  /**
   * List Products
   */
  async listProducts(limit: number = 10, societeId?: string): Promise<Stripe.Product[]> {
    const stripe = await this.getStripeForSociete(societeId);
    const products = await stripe.products.list({
      limit,
      active: true,
    });
    return products.data;
  }

  /**
   * List Prices for a Product
   */
  async listPrices(productId?: string, limit: number = 10, societeId?: string): Promise<Stripe.Price[]> {
    const params: Stripe.PriceListParams = {
      limit,
      active: true,
    };
    if (productId) {
      params.product = productId;
    }
    const stripe = await this.getStripeForSociete(societeId);
    const prices = await stripe.prices.list(params);
    return prices.data;
  }

  /**
   * Construct and verify Webhook Event
   * For multi-account: use societeId to get the correct webhook secret
   */
  async constructWebhookEventForSociete(
    payload: Buffer | string,
    signature: string,
    societeId?: string,
  ): Promise<Stripe.Event> {
    const stripe = await this.getStripeForSociete(societeId);
    const webhookSecret = await this.getWebhookSecretForSociete(societeId);
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Construct and verify Webhook Event (legacy - uses default secret)
   */
  constructWebhookEvent(
    payload: Buffer | string,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    return this.ensureStripeConfigured().webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get Stripe instance for advanced operations (default account)
   * For multi-account, prefer getStripeForSociete(societeId)
   */
  getStripeInstance(): Stripe {
    return this.ensureStripeConfigured();
  }

  // ========== SETUP INTENTS ==========

  /**
   * Create a SetupIntent for saving payment methods without immediate payment
   * Use cases: free trials, saving card for future use, multi-payment method
   */
  async createSetupIntent(
    params: CreateSetupIntentParams,
  ): Promise<Stripe.SetupIntent> {
    const setupIntentParams: Stripe.SetupIntentCreateParams = {
      metadata: params.metadata,
      description: params.description,
      usage: params.usage || 'off_session',
    };

    if (params.customerId) {
      setupIntentParams.customer = params.customerId;
    }

    if (params.paymentMethodTypes && params.paymentMethodTypes.length > 0) {
      setupIntentParams.payment_method_types = params.paymentMethodTypes as any;
    } else {
      setupIntentParams.automatic_payment_methods = { enabled: true };
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    const setupIntent = await stripe.setupIntents.create(setupIntentParams);
    this.logger.log(`SetupIntent created: ${setupIntent.id}`);
    return setupIntent;
  }

  /**
   * Retrieve a SetupIntent
   */
  async retrieveSetupIntent(setupIntentId: string, societeId?: string): Promise<Stripe.SetupIntent> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.setupIntents.retrieve(setupIntentId);
  }

  /**
   * Confirm a SetupIntent
   */
  async confirmSetupIntent(
    setupIntentId: string,
    paymentMethodId?: string,
    societeId?: string,
  ): Promise<Stripe.SetupIntent> {
    const params: Stripe.SetupIntentConfirmParams = {};
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.setupIntents.confirm(setupIntentId, params);
  }

  /**
   * Cancel a SetupIntent
   */
  async cancelSetupIntent(setupIntentId: string, societeId?: string): Promise<Stripe.SetupIntent> {
    const stripe = await this.getStripeForSociete(societeId);
    return stripe.setupIntents.cancel(setupIntentId);
  }

  // ========== BILLING PORTAL ==========

  /**
   * Create a Billing Portal session for customer self-service
   * Allows customers to manage subscriptions, payment methods, invoices
   */
  async createBillingPortalSession(
    params: CreateBillingPortalSessionParams,
  ): Promise<Stripe.BillingPortal.Session> {
    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: params.customerId,
      return_url: params.returnUrl,
    };

    if (params.configuration) {
      sessionParams.configuration = params.configuration;
    }

    const stripe = await this.getStripeForSociete(params.societeId);
    const session = await stripe.billingPortal.sessions.create(sessionParams);
    this.logger.log(`Billing Portal session created: ${session.id}`);
    return session;
  }

  /**
   * Build line items for checkout session
   * For subscriptions without priceId, creates the price in Stripe first
   */
  private async buildLineItemsAsync(
    params: CreateCheckoutSessionParams,
    stripe: Stripe,
  ): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
    const isSubscription = params.mode === 'subscription';

    if (params.lineItems && params.lineItems.length > 0) {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const item of params.lineItems) {
        if (item.priceId) {
          lineItems.push({
            price: item.priceId,
            quantity: item.quantity,
          });
        } else if (isSubscription && item.amount) {
          // For subscriptions, create a recurring price in Stripe
          const price = await this.createDynamicPrice(stripe, {
            name: item.name || 'Subscription',
            description: item.description,
            amount: item.amount,
            currency: item.currency || params.currency || 'eur',
            interval: item.interval || 'month',
            metadata: params.metadata,
          });
          lineItems.push({
            price: price.id,
            quantity: item.quantity,
          });
        } else {
          // For one-time payments, use price_data
          lineItems.push({
            price_data: {
              currency: item.currency || params.currency || 'eur',
              product_data: {
                name: item.name || 'Product',
                description: item.description,
              },
              unit_amount: item.amount,
            },
            quantity: item.quantity,
          });
        }
      }

      return lineItems;
    }

    if (params.priceId) {
      return [{ price: params.priceId, quantity: 1 }];
    }

    if (params.amount) {
      if (isSubscription) {
        // Create a recurring price for subscription
        const price = await this.createDynamicPrice(stripe, {
          name: 'Subscription',
          amount: params.amount,
          currency: params.currency || 'eur',
          interval: 'month',
          metadata: params.metadata,
        });
        return [{ price: price.id, quantity: 1 }];
      }

      return [
        {
          price_data: {
            currency: params.currency || 'eur',
            product_data: {
              name: 'Payment',
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ];
    }

    throw new Error(
      'Either priceId, amount, or lineItems must be provided for checkout session',
    );
  }

  /**
   * Create a dynamic recurring price in Stripe (for subscriptions without priceId)
   */
  private async createDynamicPrice(
    stripe: Stripe,
    params: {
      name: string;
      description?: string;
      amount: number;
      currency: string;
      interval: 'day' | 'week' | 'month' | 'year';
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Price> {
    // First create or find a product
    const product = await stripe.products.create({
      name: params.name,
      description: params.description,
      metadata: {
        ...params.metadata,
        dynamic: 'true',
      },
    });

    // Then create the recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: params.amount,
      currency: params.currency,
      recurring: {
        interval: params.interval,
      },
      metadata: {
        ...params.metadata,
        dynamic: 'true',
      },
    });

    this.logger.log(`Created dynamic price ${price.id} for product ${product.id}`);
    return price;
  }
}

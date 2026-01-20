import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// GoCardless SDK imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gocardless = require('gocardless-nodejs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const constants = require('gocardless-nodejs/constants');

export interface GoCardlessCustomer {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  created_at: string;
}

export interface GoCardlessMandate {
  id: string;
  status: string;
  reference?: string;
  scheme: string;
  created_at: string;
  links: {
    customer_bank_account: string;
    creditor: string;
  };
}

export interface GoCardlessPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  charge_date: string;
  reference?: string;
  created_at: string;
  links: {
    mandate: string;
    creditor: string;
  };
}

export interface GoCardlessSubscription {
  id: string;
  amount: number;
  currency: string;
  status: string;
  name?: string;
  interval_unit: string;
  day_of_month?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  upcoming_payments?: Array<{
    charge_date: string;
    amount: number;
  }>;
  links: {
    mandate: string;
  };
}

export interface GoCardlessBillingRequest {
  id: string;
  status: string;
  created_at: string;
  mandate_request?: {
    currency: string;
    scheme: string;
  };
  links?: {
    customer?: string;
    customer_bank_account?: string;
    mandate_request_mandate?: string;
  };
  metadata?: Record<string, string>;
}

export interface GoCardlessBillingRequestFlow {
  authorisation_url: string;
  redirect_uri: string;
  exit_uri?: string;
  created_at: string;
  expires_at: string;
}

@Injectable()
export class GoCardlessService implements OnModuleInit {
  private client: any;
  private readonly logger = new Logger(GoCardlessService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const accessToken = this.configService.get<string>('GOCARDLESS_ACCESS_TOKEN');
    const environment = this.configService.get<string>('GOCARDLESS_ENVIRONMENT');

    if (!accessToken) {
      this.logger.warn(
        'GOCARDLESS_ACCESS_TOKEN not configured. GoCardless features will be disabled.',
      );
      return;
    }

    const env =
      environment === 'live'
        ? constants.Environments.Live
        : constants.Environments.Sandbox;

    this.client = gocardless(accessToken, env, {
      raiseOnIdempotencyConflict: false,
    });

    this.logger.log(`GoCardless client initialized in ${environment || 'sandbox'} mode`);
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new Error(
        'GoCardless client not initialized. Please configure GOCARDLESS_ACCESS_TOKEN.',
      );
    }
  }

  // ============================================
  // BILLING REQUESTS (Mandate Setup)
  // ============================================

  /**
   * Create a Billing Request for mandate setup
   */
  async createBillingRequest(
    currency: string = 'EUR',
    scheme: string = 'sepa_core',
    metadata?: Record<string, string>,
  ): Promise<GoCardlessBillingRequest> {
    this.ensureClient();

    const billingRequest = await this.client.billingRequests.create({
      mandate_request: {
        currency,
        scheme,
      },
      metadata,
    });

    this.logger.log(`Created billing request: ${billingRequest.id}`);
    return billingRequest;
  }

  /**
   * Create a Billing Request Flow (generates authorization URL)
   */
  async createBillingRequestFlow(
    billingRequestId: string,
    redirectUri: string,
    exitUri: string,
  ): Promise<GoCardlessBillingRequestFlow> {
    this.ensureClient();

    const flow = await this.client.billingRequestFlows.create({
      redirect_uri: redirectUri,
      exit_uri: exitUri,
      links: {
        billing_request: billingRequestId,
      },
    });

    this.logger.log(
      `Created billing request flow for ${billingRequestId}: ${flow.authorisation_url}`,
    );
    return flow;
  }

  /**
   * Get a Billing Request by ID
   */
  async getBillingRequest(billingRequestId: string): Promise<GoCardlessBillingRequest> {
    this.ensureClient();
    return this.client.billingRequests.get(billingRequestId);
  }

  // ============================================
  // MANDATES
  // ============================================

  /**
   * Get a mandate by ID
   */
  async getMandate(mandateId: string): Promise<GoCardlessMandate> {
    this.ensureClient();
    return this.client.mandates.get(mandateId);
  }

  /**
   * List mandates with optional filters
   */
  async listMandates(params?: {
    customer?: string;
    status?: string;
    limit?: number;
  }): Promise<GoCardlessMandate[]> {
    this.ensureClient();
    const response = await this.client.mandates.list(params || {});
    return response.mandates;
  }

  /**
   * Cancel a mandate
   */
  async cancelMandate(mandateId: string): Promise<GoCardlessMandate> {
    this.ensureClient();
    const mandate = await this.client.mandates.cancel(mandateId);
    this.logger.log(`Cancelled mandate: ${mandateId}`);
    return mandate;
  }

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * Create a one-off payment
   */
  async createPayment(
    mandateId: string,
    amount: number,
    currency: string = 'EUR',
    options?: {
      reference?: string;
      description?: string;
      metadata?: Record<string, string>;
      idempotencyKey?: string;
    },
  ): Promise<GoCardlessPayment> {
    this.ensureClient();

    const paymentParams: any = {
      amount,
      currency,
      links: {
        mandate: mandateId,
      },
    };

    if (options?.reference) paymentParams.reference = options.reference;
    if (options?.description) paymentParams.description = options.description;
    if (options?.metadata) paymentParams.metadata = options.metadata;

    const headers: any = {};
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const payment = await this.client.payments.create(paymentParams, headers);
    this.logger.log(`Created payment: ${payment.id} for mandate ${mandateId}`);
    return payment;
  }

  /**
   * Get a payment by ID
   */
  async getPayment(paymentId: string): Promise<GoCardlessPayment> {
    this.ensureClient();
    return this.client.payments.get(paymentId);
  }

  /**
   * List payments with optional filters
   */
  async listPayments(params?: {
    mandate?: string;
    customer?: string;
    status?: string;
    limit?: number;
  }): Promise<GoCardlessPayment[]> {
    this.ensureClient();
    const response = await this.client.payments.list(params || {});
    return response.payments;
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: string): Promise<GoCardlessPayment> {
    this.ensureClient();
    const payment = await this.client.payments.cancel(paymentId);
    this.logger.log(`Cancelled payment: ${paymentId}`);
    return payment;
  }

  /**
   * Retry a failed payment
   */
  async retryPayment(paymentId: string): Promise<GoCardlessPayment> {
    this.ensureClient();
    const payment = await this.client.payments.retry(paymentId);
    this.logger.log(`Retried payment: ${paymentId}`);
    return payment;
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  /**
   * Create a recurring subscription
   */
  async createSubscription(
    mandateId: string,
    amount: number,
    currency: string = 'EUR',
    options?: {
      name?: string;
      intervalUnit?: 'weekly' | 'monthly' | 'yearly';
      dayOfMonth?: number;
      count?: number;
      startDate?: string;
      metadata?: Record<string, string>;
      idempotencyKey?: string;
    },
  ): Promise<GoCardlessSubscription> {
    this.ensureClient();

    const subscriptionParams: any = {
      amount,
      currency,
      interval_unit: options?.intervalUnit || 'monthly',
      links: {
        mandate: mandateId,
      },
    };

    if (options?.name) subscriptionParams.name = options.name;
    if (options?.dayOfMonth) subscriptionParams.day_of_month = options.dayOfMonth;
    if (options?.count) subscriptionParams.count = options.count;
    if (options?.startDate) subscriptionParams.start_date = options.startDate;
    if (options?.metadata) subscriptionParams.metadata = options.metadata;

    const headers: any = {};
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const subscription = await this.client.subscriptions.create(
      subscriptionParams,
      headers,
    );
    this.logger.log(
      `Created subscription: ${subscription.id} for mandate ${mandateId}`,
    );
    return subscription;
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<GoCardlessSubscription> {
    this.ensureClient();
    return this.client.subscriptions.get(subscriptionId);
  }

  /**
   * List subscriptions with optional filters
   */
  async listSubscriptions(params?: {
    mandate?: string;
    customer?: string;
    status?: string;
    limit?: number;
  }): Promise<GoCardlessSubscription[]> {
    this.ensureClient();
    const response = await this.client.subscriptions.list(params || {});
    return response.subscriptions;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<GoCardlessSubscription> {
    this.ensureClient();
    const subscription = await this.client.subscriptions.cancel(subscriptionId);
    this.logger.log(`Cancelled subscription: ${subscriptionId}`);
    return subscription;
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<GoCardlessSubscription> {
    this.ensureClient();
    const subscription = await this.client.subscriptions.pause(subscriptionId);
    this.logger.log(`Paused subscription: ${subscriptionId}`);
    return subscription;
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<GoCardlessSubscription> {
    this.ensureClient();
    const subscription = await this.client.subscriptions.resume(subscriptionId);
    this.logger.log(`Resumed subscription: ${subscriptionId}`);
    return subscription;
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<GoCardlessCustomer> {
    this.ensureClient();
    return this.client.customers.get(customerId);
  }

  /**
   * List customers
   */
  async listCustomers(params?: {
    email?: string;
    limit?: number;
  }): Promise<GoCardlessCustomer[]> {
    this.ensureClient();
    const response = await this.client.customers.list(params || {});
    return response.customers;
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string,
  ): boolean {
    const crypto = require('crypto');
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return signature === computedSignature;
  }

  /**
   * Parse webhook events from body
   */
  parseWebhookEvents(body: any): any[] {
    return body.events || [];
  }
}

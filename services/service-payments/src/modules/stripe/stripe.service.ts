import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripeAccountEntity } from './entities/stripe-account.entity';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripeClients: Map<string, Stripe> = new Map();

  constructor(
    @InjectRepository(StripeAccountEntity)
    private readonly stripeAccountRepository: Repository<StripeAccountEntity>,
  ) {}

  private getStripeClient(account: StripeAccountEntity): Stripe {
    const cacheKey = `${account.id}-${account.isTestMode}`;

    if (!this.stripeClients.has(cacheKey)) {
      const stripe = new Stripe(account.stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      });
      this.stripeClients.set(cacheKey, stripe);
    }

    return this.stripeClients.get(cacheKey)!;
  }

  async getAccountBySocieteId(societeId: string): Promise<StripeAccountEntity | null> {
    return this.stripeAccountRepository.findOne({
      where: { societeId, actif: true },
    });
  }

  async getAccountById(id: string): Promise<StripeAccountEntity | null> {
    return this.stripeAccountRepository.findOne({
      where: { id },
    });
  }

  async createCheckoutSession(
    societeId: string,
    params: {
      amount: number;
      currency?: string;
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
      clientReferenceId?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<{ sessionId: string; sessionUrl: string }> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured for this company');
    }

    const stripe = this.getStripeClient(account);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency || 'eur',
            product_data: {
              name: 'Payment',
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      client_reference_id: params.clientReferenceId,
      metadata: params.metadata,
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url!,
    };
  }

  async createPaymentIntent(
    societeId: string,
    params: {
      amount: number;
      currency?: string;
      customerId?: string;
      paymentMethodId?: string;
      metadata?: Record<string, string>;
      confirm?: boolean;
    },
  ): Promise<Stripe.PaymentIntent> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured');
    }

    const stripe = this.getStripeClient(account);

    return stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency || 'eur',
      customer: params.customerId,
      payment_method: params.paymentMethodId,
      metadata: params.metadata,
      confirm: params.confirm,
      automatic_payment_methods: params.confirm ? undefined : { enabled: true },
    });
  }

  async confirmPaymentIntent(
    societeId: string,
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured');
    }

    const stripe = this.getStripeClient(account);

    return stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  async createRefund(
    societeId: string,
    params: {
      paymentIntentId: string;
      amount?: number;
      reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    },
  ): Promise<Stripe.Refund> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured');
    }

    const stripe = this.getStripeClient(account);

    return stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amount ? Math.round(params.amount * 100) : undefined,
      reason: params.reason,
    });
  }

  async createCustomer(
    societeId: string,
    params: {
      email: string;
      name?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Customer> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured');
    }

    const stripe = this.getStripeClient(account);

    return stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  }

  async createSubscription(
    societeId: string,
    params: {
      customerId: string;
      priceId: string;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Subscription> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured');
    }

    const stripe = this.getStripeClient(account);

    return stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
    });
  }

  async cancelSubscription(
    societeId: string,
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<Stripe.Subscription> {
    const account = await this.getAccountBySocieteId(societeId);
    if (!account || !account.isConfigured()) {
      throw new NotFoundException('Stripe account not configured');
    }

    const stripe = this.getStripeClient(account);

    if (immediately) {
      return stripe.subscriptions.cancel(subscriptionId);
    }

    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string,
  ): Promise<Stripe.Event> {
    const stripe = new Stripe('', { apiVersion: '2025-12-15.clover' });
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async getAccountInfo(societeId: string): Promise<{
    configured: boolean;
    testMode: boolean;
    hasWebhook: boolean;
  }> {
    const account = await this.getAccountBySocieteId(societeId);

    return {
      configured: account?.isConfigured() ?? false,
      testMode: account?.isTestMode ?? true,
      hasWebhook: account?.hasWebhookSecret() ?? false,
    };
  }
}

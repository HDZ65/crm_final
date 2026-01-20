import { Injectable, Logger, Inject } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentIntentStatus, PSPName } from '../../../core/domain/payment.enums';

export interface PaymentIntentRepositoryPort {
  findByPspPaymentId(pspPaymentId: string): Promise<any | null>;
  update(id: string, data: Partial<any>): Promise<any>;
}

export interface PaymentEventRepositoryPort {
  create(data: any): Promise<any>;
  findByPspEventId(pspEventId: string): Promise<any | null>;
}

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    @Inject('PaymentIntentRepositoryPort')
    private readonly paymentIntentRepository: PaymentIntentRepositoryPort,
    @Inject('PaymentEventRepositoryPort')
    private readonly paymentEventRepository: PaymentEventRepositoryPort,
  ) {}

  /**
   * Check if event was already processed (idempotency)
   * @returns true if event already exists (skip processing), false if new event
   */
  async isEventAlreadyProcessed(eventId: string): Promise<boolean> {
    const existingEvent = await this.paymentEventRepository.findByPspEventId(eventId);
    if (existingEvent) {
      this.logger.log(`Event ${eventId} already processed, skipping`);
      return true;
    }
    return false;
  }

  /**
   * Handle payment_intent.succeeded event
   */
  async handlePaymentIntentSucceeded(
    event: Stripe.PaymentIntentSucceededEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    await this.updatePaymentIntentStatus(
      paymentIntent.id,
      PaymentIntentStatus.SUCCEEDED,
    );

    await this.createPaymentEvent({
      pspPaymentId: paymentIntent.id,
      eventType: 'payment_intent.succeeded',
      payload: event,
    });
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  async handlePaymentIntentFailed(
    event: Stripe.PaymentIntentPaymentFailedEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    this.logger.log(
      `Failure reason: ${paymentIntent.last_payment_error?.message}`,
    );

    await this.updatePaymentIntentStatus(
      paymentIntent.id,
      PaymentIntentStatus.FAILED,
      paymentIntent.last_payment_error?.code,
      paymentIntent.last_payment_error?.message,
    );

    await this.createPaymentEvent({
      pspPaymentId: paymentIntent.id,
      eventType: 'payment_intent.payment_failed',
      payload: event,
    });
  }

  /**
   * Handle payment_intent.processing event
   */
  async handlePaymentIntentProcessing(
    event: Stripe.PaymentIntentProcessingEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment processing: ${paymentIntent.id}`);

    await this.updatePaymentIntentStatus(
      paymentIntent.id,
      PaymentIntentStatus.PROCESSING,
    );

    await this.createPaymentEvent({
      pspPaymentId: paymentIntent.id,
      eventType: 'payment_intent.processing',
      payload: event,
    });
  }

  /**
   * Handle payment_intent.canceled event
   */
  async handlePaymentIntentCanceled(
    event: Stripe.PaymentIntentCanceledEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);

    await this.updatePaymentIntentStatus(
      paymentIntent.id,
      PaymentIntentStatus.CANCELLED,
    );

    await this.createPaymentEvent({
      pspPaymentId: paymentIntent.id,
      eventType: 'payment_intent.canceled',
      payload: event,
    });
  }

  /**
   * Handle checkout.session.completed event
   */
  async handleCheckoutSessionCompleted(
    event: Stripe.CheckoutSessionCompletedEvent,
  ): Promise<void> {
    const session = event.data.object;
    this.logger.log(`Checkout session completed: ${session.id}`);

    await this.createPaymentEvent({
      pspPaymentId: session.payment_intent as string,
      eventType: 'checkout.session.completed',
      payload: event,
    });
  }

  /**
   * Handle checkout.session.expired event
   */
  async handleCheckoutSessionExpired(
    event: Stripe.CheckoutSessionExpiredEvent,
  ): Promise<void> {
    const session = event.data.object;
    this.logger.log(`Checkout session expired: ${session.id}`);

    await this.createPaymentEvent({
      pspPaymentId: session.id,
      eventType: 'checkout.session.expired',
      payload: event,
    });
  }

  /**
   * Handle customer.subscription.created event
   */
  async handleSubscriptionCreated(
    event: Stripe.CustomerSubscriptionCreatedEvent,
  ): Promise<void> {
    const subscription = event.data.object;
    this.logger.log(
      `Subscription created: ${subscription.id} - Status: ${subscription.status}`,
    );

    await this.createPaymentEvent({
      pspPaymentId: subscription.id,
      eventType: 'customer.subscription.created',
      payload: event,
    });
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(
    event: Stripe.CustomerSubscriptionUpdatedEvent,
  ): Promise<void> {
    const subscription = event.data.object;
    this.logger.log(
      `Subscription updated: ${subscription.id} - Status: ${subscription.status}`,
    );

    await this.createPaymentEvent({
      pspPaymentId: subscription.id,
      eventType: 'customer.subscription.updated',
      payload: event,
    });
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(
    event: Stripe.CustomerSubscriptionDeletedEvent,
  ): Promise<void> {
    const subscription = event.data.object;
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    await this.createPaymentEvent({
      pspPaymentId: subscription.id,
      eventType: 'customer.subscription.deleted',
      payload: event,
    });
  }

  /**
   * Handle invoice.paid event
   */
  async handleInvoicePaid(event: Stripe.InvoicePaidEvent): Promise<void> {
    const invoice = event.data.object;
    this.logger.log(`Invoice paid: ${invoice.id}`);

    await this.createPaymentEvent({
      pspPaymentId: invoice.id,
      eventType: 'invoice.paid',
      payload: event,
    });
  }

  /**
   * Handle invoice.payment_failed event
   */
  async handleInvoicePaymentFailed(
    event: Stripe.InvoicePaymentFailedEvent,
  ): Promise<void> {
    const invoice = event.data.object;
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    await this.createPaymentEvent({
      pspPaymentId: invoice.id,
      eventType: 'invoice.payment_failed',
      payload: event,
    });
  }

  /**
   * Handle charge.refunded event
   */
  async handleChargeRefunded(event: Stripe.ChargeRefundedEvent): Promise<void> {
    const charge = event.data.object;
    this.logger.log(`Charge refunded: ${charge.id}`);

    await this.createPaymentEvent({
      pspPaymentId: charge.payment_intent as string,
      eventType: 'charge.refunded',
      payload: event,
    });
  }

  /**
   * Generic event handler for unhandled events
   */
  async handleUnknownEvent(event: Stripe.Event): Promise<void> {
    this.logger.warn(`Unhandled Stripe event type: ${event.type}`);

    await this.createPaymentEvent({
      pspPaymentId: (event.data.object as any).id || 'unknown',
      eventType: event.type,
      payload: event,
    });
  }

  private async updatePaymentIntentStatus(
    pspPaymentId: string,
    status: PaymentIntentStatus,
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const paymentIntent =
        await this.paymentIntentRepository.findByPspPaymentId(pspPaymentId);

      if (paymentIntent && paymentIntent.pspName === PSPName.STRIPE) {
        await this.paymentIntentRepository.update(paymentIntent.id, {
          status,
          errorCode,
          errorMessage,
        });
        this.logger.log(
          `Updated PaymentIntent ${paymentIntent.id} status to ${status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update PaymentIntent status for ${pspPaymentId}`,
        error,
      );
    }
  }

  private async createPaymentEvent(data: {
    pspPaymentId: string;
    eventType: string;
    payload: Stripe.Event;
  }): Promise<void> {
    try {
      await this.paymentEventRepository.create({
        pspEventId: data.payload.id,
        organisationId: (data.payload.data.object as any).metadata
          ?.organisationId ?? 'unknown',
        paymentIntentId: data.pspPaymentId || 'unknown',
        eventType: data.eventType,
        rawPayload: data.payload,
        receivedAt: new Date(),
        processed: true,
        processedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to create PaymentEvent`, error);
    }
  }
}

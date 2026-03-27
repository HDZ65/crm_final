import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import { WooCommerceSyncService } from './woocommerce-sync.service';
import { WooCommerceWebhookService } from './woocommerce-webhook.service';

interface WooCommerceNatsMessage {
  eventId: string;
  organisationId: string;
  topic: string;
  wooResourceId: string;
  payload: Record<string, any>;
}

/**
 * NATS consumers for WooCommerce webhook events.
 * 5 workers processing different WooCommerce event types.
 */
@Injectable()
export class WooCommerceNatsWorkersService implements OnModuleInit {
  private readonly logger = new Logger(WooCommerceNatsWorkersService.name);

  constructor(
    private readonly syncService: WooCommerceSyncService,
    private readonly webhookService: WooCommerceWebhookService,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.natsService) {
      this.logger.warn('NATS not available, WooCommerce workers will not start');
      return;
    }

    await this.registerWorkers();
  }

  private async registerWorkers(): Promise<void> {
    if (!this.natsService) return;

    // Worker 1: Customer Created
    await this.natsService.subscribe<WooCommerceNatsMessage>(
      'woocommerce.customer.created',
      async (data) => this.handleCustomerCreated(data),
    );

    // Worker 2: Subscription Created
    await this.natsService.subscribe<WooCommerceNatsMessage>(
      'woocommerce.subscription.created',
      async (data) => this.handleSubscriptionCreated(data),
    );

    // Worker 3: Subscription Updated
    await this.natsService.subscribe<WooCommerceNatsMessage>(
      'woocommerce.subscription.updated',
      async (data) => this.handleSubscriptionUpdated(data),
    );

    // Worker 4: Order Completed
    await this.natsService.subscribe<WooCommerceNatsMessage>(
      'woocommerce.order.completed',
      async (data) => this.handleOrderCompleted(data),
    );

    // Worker 5: Payment Intent Succeeded
    await this.natsService.subscribe<WooCommerceNatsMessage>(
      'woocommerce.payment_intent.succeeded',
      async (data) => this.handlePaymentSucceeded(data),
    );

    this.logger.log('WooCommerce NATS workers registered (5 consumers)');
  }

  /**
   * Worker 1: woocommerce.customer.created
   * Create or update ClientBase via reconciliation.
   */
  async handleCustomerCreated(data: WooCommerceNatsMessage): Promise<void> {
    this.logger.log(`Processing customer.created: ${data.wooResourceId}`);

    try {
      await this.webhookService.markProcessing(data.eventId);

      const result = await this.syncService.syncCustomer(
        data.organisationId,
        data.wooResourceId,
        data.payload,
      );

      this.logger.log(
        `Customer synced: woo=${data.wooResourceId} → crm=${result.clientId} (new=${result.isNew})`,
      );

      await this.webhookService.markProcessed(data.eventId);
    } catch (error) {
      this.logger.error(
        `Failed to process customer.created ${data.wooResourceId}: ${error}`,
      );
      await this.webhookService.markFailed(
        data.eventId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Worker 2: woocommerce.subscription.created
   * Create Subscription in CRM.
   */
  async handleSubscriptionCreated(data: WooCommerceNatsMessage): Promise<void> {
    this.logger.log(`Processing subscription.created: ${data.wooResourceId}`);

    try {
      await this.webhookService.markProcessing(data.eventId);

      const result = await this.syncService.syncSubscriptionCreated(
        data.organisationId,
        data.wooResourceId,
        data.payload,
      );

      this.logger.log(
        `Subscription created: woo=${data.wooResourceId} → crm=${result.subscriptionId}`,
      );

      await this.webhookService.markProcessed(data.eventId);
    } catch (error) {
      this.logger.error(
        `Failed to process subscription.created ${data.wooResourceId}: ${error}`,
      );
      await this.webhookService.markFailed(
        data.eventId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Worker 3: woocommerce.subscription.updated
   * Update Subscription (status/frequency changes).
   */
  async handleSubscriptionUpdated(data: WooCommerceNatsMessage): Promise<void> {
    this.logger.log(`Processing subscription.updated: ${data.wooResourceId}`);

    try {
      await this.webhookService.markProcessing(data.eventId);

      const result = await this.syncService.syncSubscriptionUpdated(
        data.organisationId,
        data.wooResourceId,
        data.payload,
      );

      this.logger.log(
        `Subscription updated: woo=${data.wooResourceId} → crm=${result.subscriptionId} (updated=${result.updated})`,
      );

      await this.webhookService.markProcessed(data.eventId);
    } catch (error) {
      this.logger.error(
        `Failed to process subscription.updated ${data.wooResourceId}: ${error}`,
      );
      await this.webhookService.markFailed(
        data.eventId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Worker 4: woocommerce.order.completed
   * Link to existing subscription cycle.
   */
  async handleOrderCompleted(data: WooCommerceNatsMessage): Promise<void> {
    this.logger.log(`Processing order.completed: ${data.wooResourceId}`);

    try {
      await this.webhookService.markProcessing(data.eventId);

      const result = await this.syncService.syncOrderCompleted(
        data.organisationId,
        data.wooResourceId,
        data.payload,
      );

      this.logger.log(
        `Order synced: woo=${data.wooResourceId} → crm=${result.orderId} (linkedSub=${result.linkedSubscriptionId})`,
      );

      await this.webhookService.markProcessed(data.eventId);
    } catch (error) {
      this.logger.error(
        `Failed to process order.completed ${data.wooResourceId}: ${error}`,
      );
      await this.webhookService.markFailed(
        data.eventId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Worker 5: woocommerce.payment_intent.succeeded
   * Mark charge as paid.
   */
  async handlePaymentSucceeded(data: WooCommerceNatsMessage): Promise<void> {
    this.logger.log(`Processing payment_intent.succeeded: ${data.wooResourceId}`);

    try {
      await this.webhookService.markProcessing(data.eventId);

      const result = await this.syncService.syncPaymentSucceeded(
        data.organisationId,
        data.wooResourceId,
        data.payload,
      );

      this.logger.log(
        `Payment synced: woo=${data.wooResourceId} → crm=${result.paymentId}`,
      );

      await this.webhookService.markProcessed(data.eventId);
    } catch (error) {
      this.logger.error(
        `Failed to process payment_intent.succeeded ${data.wooResourceId}: ${error}`,
      );
      await this.webhookService.markFailed(
        data.eventId,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

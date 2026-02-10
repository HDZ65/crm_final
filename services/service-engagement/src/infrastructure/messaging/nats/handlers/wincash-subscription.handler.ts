import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Handler for WinCash subscription events via NATS
 * Subjects: wincash.subscription.created, wincash.subscription.updated, wincash.subscription.cancelled
 *
 * NOTE: NATS subscription will be wired when @crm/nats-utils is added.
 * Currently exposes handler methods for direct invocation or gRPC relay.
 */
@Injectable()
export class WincashSubscriptionHandler implements OnModuleInit {
  private readonly logger = new Logger(WincashSubscriptionHandler.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('WincashSubscriptionHandler initialized - ready to process subscription events');
    // TODO: Wire NATS subscriptions when nats-utils is available
    // await this.natsService.subscribeProto('wincash.subscription.*', this.handleEvent.bind(this));
  }

  async handleSubscriptionCreated(data: {
    externalId: string;
    customerId: string;
    programId: string;
    startDate: string;
    endDate?: string;
    organisationId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing wincash.subscription.created: ${data.externalId}`);

    try {
      // TODO: Create subscription record in CRM
      // 1. Validate customer exists
      // 2. Create subscription entity
      // 3. Emit internal event for downstream processing
      this.logger.debug(`Subscription created event processed: ${data.externalId} (program=${data.programId})`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.created: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleSubscriptionUpdated(data: {
    externalId: string;
    status?: 'active' | 'paused' | 'cancelled' | 'expired';
    endDate?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing wincash.subscription.updated: ${data.externalId}`);

    try {
      // TODO: Update subscription in CRM
      // 1. Find subscription by external ID
      // 2. Update status and dates
      // 3. If paused/cancelled, trigger notification
      this.logger.debug(`Subscription updated event processed: ${data.externalId} (status=${data.status})`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.updated: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleSubscriptionCancelled(data: {
    externalId: string;
    reason?: string;
    cancelledAt: string;
  }): Promise<void> {
    this.logger.log(`Processing wincash.subscription.cancelled: ${data.externalId}`);

    try {
      // TODO: Cancel subscription in CRM
      // 1. Find subscription by external ID
      // 2. Mark as cancelled with reason
      // 3. Emit notification to assigned commercial
      this.logger.debug(`Subscription cancelled event processed: ${data.externalId} (reason=${data.reason})`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.cancelled: ${data.externalId}`, error.stack);
      throw error;
    }
  }
}

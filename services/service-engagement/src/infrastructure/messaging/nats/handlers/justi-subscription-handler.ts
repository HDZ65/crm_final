import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JustiPlusService } from '../../../external/justi-plus/justi-plus.service';

/**
 * Handler for Justi+ subscription events via NATS
 * Subjects: justi.subscription.activated, justi.subscription.suspended,
 *           justi.subscription.resumed, justi.subscription.cancelled
 *
 * NOTE: NATS subscription will be wired when @crm/nats-utils is added.
 * Currently exposes handler methods for direct invocation or gRPC relay.
 */

export interface JustiSubscriptionEvent {
  externalId: string;
  clientId: string;
  contratId: string;
  organisationId: string;
  plan: string;
  status: 'active' | 'suspended' | 'cancelled';
  eventType: 'activated' | 'suspended' | 'resumed' | 'cancelled';
  effectiveDate: string;
  timestamp: string;
}

@Injectable()
export class JustiSubscriptionHandler implements OnModuleInit {
  private readonly logger = new Logger(JustiSubscriptionHandler.name);

  constructor(private readonly justiPlusService: JustiPlusService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('JustiSubscriptionHandler initialized - ready to process subscription events');
    // TODO: Wire NATS subscriptions when nats-utils is available
    // await this.natsService.subscribeProto('justi.subscription.*', this.handleEvent.bind(this));
  }

  async handleSubscriptionActivated(data: JustiSubscriptionEvent): Promise<void> {
    this.logger.log(`Processing justi.subscription.activated: ${data.externalId}`);

    try {
      // TODO: Link Justi+ subscription to CRM contract
      // - Update contract metadata with active Justi+ subscription
      // - Create activity record
      this.logger.debug(`Subscription activated event processed: ${data.externalId} (plan=${data.plan})`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.activated: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleSubscriptionSuspended(data: JustiSubscriptionEvent): Promise<void> {
    this.logger.log(`Processing justi.subscription.suspended: ${data.externalId}`);

    try {
      // TODO: Update contract to reflect suspended Justi+ coverage
      // - Update contract metadata
      // - Create notification for assigned user
      this.logger.debug(`Subscription suspended event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.suspended: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleSubscriptionResumed(data: JustiSubscriptionEvent): Promise<void> {
    this.logger.log(`Processing justi.subscription.resumed: ${data.externalId}`);

    try {
      // TODO: Update contract to reflect resumed Justi+ coverage
      this.logger.debug(`Subscription resumed event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.resumed: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleSubscriptionCancelled(data: JustiSubscriptionEvent): Promise<void> {
    this.logger.log(`Processing justi.subscription.cancelled: ${data.externalId}`);

    try {
      // TODO: Update contract to reflect cancelled Justi+ coverage
      // - Create notification
      // - Flag contract as needing review
      this.logger.debug(`Subscription cancelled event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process subscription.cancelled: ${data.externalId}`, error.stack);
      throw error;
    }
  }
}

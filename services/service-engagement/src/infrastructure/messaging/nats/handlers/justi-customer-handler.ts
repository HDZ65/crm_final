import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Handler for Justi+ customer events via NATS
 * Subjects: justi.customer.created, justi.customer.updated, justi.customer.deleted
 *
 * NOTE: NATS subscription will be wired when @crm/nats-utils is added.
 * Currently exposes handler methods for direct invocation or gRPC relay.
 */

export interface JustiCustomerEvent {
  externalId: string;
  clientId: string;
  organisationId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  status: string;
  eventType: 'created' | 'updated' | 'deleted';
  timestamp: string;
}

@Injectable()
export class JustiCustomerHandler implements OnModuleInit {
  private readonly logger = new Logger(JustiCustomerHandler.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('JustiCustomerHandler initialized - ready to process customer events');
    // TODO: Wire NATS subscriptions when nats-utils is available
    // await this.natsService.subscribeProto('justi.customer.*', this.handleEvent.bind(this));
  }

  async handleCustomerCreated(data: JustiCustomerEvent): Promise<void> {
    this.logger.log(`Processing justi.customer.created: ${data.externalId}`);

    try {
      // TODO: Link Justi+ customer to CRM client
      // 1. Check if customer exists by clientId
      // 2. If exists, update with Justi+ external ID
      // 3. If not, create a placeholder or queue for review
      this.logger.debug(`Customer created event processed: ${data.externalId} (${data.email})`);
    } catch (error: any) {
      this.logger.error(`Failed to process justi.customer.created: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCustomerUpdated(data: JustiCustomerEvent): Promise<void> {
    this.logger.log(`Processing justi.customer.updated: ${data.externalId}`);

    try {
      // TODO: Update linked CRM client info
      // 1. Find customer by Justi+ external ID
      // 2. Update relevant fields (nom, prenom, email, telephone)
      // 3. Emit internal notification if status changed
      this.logger.debug(`Customer updated event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process justi.customer.updated: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCustomerDeleted(data: JustiCustomerEvent): Promise<void> {
    this.logger.log(`Processing justi.customer.deleted: ${data.externalId}`);

    try {
      // TODO: Mark customer Justi+ link as inactive
      // 1. Find customer by Justi+ external ID
      // 2. Remove/deactivate Justi+ link (soft delete)
      // 3. Log activity
      this.logger.debug(`Customer deleted event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process justi.customer.deleted: ${data.externalId}`, error.stack);
      throw error;
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Handler for WinCash customer events via NATS
 * Subjects: wincash.customer.created, wincash.customer.updated, wincash.customer.deleted
 *
 * NOTE: NATS subscription will be wired when @crm/nats-utils is added.
 * Currently exposes handler methods for direct invocation or gRPC relay.
 */
@Injectable()
export class WincashCustomerHandler implements OnModuleInit {
  private readonly logger = new Logger(WincashCustomerHandler.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('WincashCustomerHandler initialized - ready to process customer events');
    // TODO: Wire NATS subscriptions when nats-utils is available
    // await this.natsService.subscribeProto('wincash.customer.*', this.handleEvent.bind(this));
  }

  async handleCustomerCreated(data: {
    externalId: string;
    email: string;
    firstName: string;
    lastName: string;
    organisationId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing wincash.customer.created: ${data.externalId}`);

    try {
      // TODO: Create or link customer in CRM
      // 1. Check if customer exists by email
      // 2. If exists, update with WinCash external ID
      // 3. If not, create a placeholder or queue for review
      this.logger.debug(`Customer created event processed: ${data.externalId} (${data.email})`);
    } catch (error: any) {
      this.logger.error(`Failed to process customer.created: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCustomerUpdated(data: {
    externalId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    loyaltyPoints?: number;
    tier?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Processing wincash.customer.updated: ${data.externalId}`);

    try {
      // TODO: Update customer data in CRM
      // 1. Find customer by WinCash external ID
      // 2. Update relevant fields
      // 3. Emit internal notification if tier changed
      this.logger.debug(`Customer updated event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process customer.updated: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCustomerDeleted(data: {
    externalId: string;
    reason?: string;
  }): Promise<void> {
    this.logger.log(`Processing wincash.customer.deleted: ${data.externalId}`);

    try {
      // TODO: Mark customer WinCash link as inactive
      // 1. Find customer by WinCash external ID
      // 2. Remove/deactivate WinCash link (soft delete)
      // 3. Log activity
      this.logger.debug(`Customer deleted event processed: ${data.externalId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process customer.deleted: ${data.externalId}`, error.stack);
      throw error;
    }
  }
}

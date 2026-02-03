import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';

@Injectable()
export class DashboardClientCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(DashboardClientCreatedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribeProto<ClientCreatedEvent>(
      CLIENT_CREATED_SUBJECT,
      ClientCreatedEvent,
      (event) => this.handleClientCreated(event),
    );
    this.logger.log(`Subscribed to ${CLIENT_CREATED_SUBJECT}`);
  }

  private async handleClientCreated(event: ClientCreatedEvent): Promise<void> {
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const organisationId = event.organisation_id ?? (event as any).organisationId;
      const clientId = event.client_id ?? (event as any).clientId;
      
      this.logger.log(
        `KPI update: New client created in org ${organisationId} (client: ${clientId})`,
      );

      await this.processedEventsRepo.markProcessed(eventId, 'dashboard.client.created');
    } catch (error) {
      this.logger.error(`Failed to process client.created event ${eventId}: ${error}`);
      throw error;
    }
  }
}

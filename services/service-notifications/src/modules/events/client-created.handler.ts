import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';
import { NotificationService } from '../notification/notification.service';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';
const SYSTEM_USER_ID = 'system';

@Injectable()
export class ClientCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(ClientCreatedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
    private readonly notificationService: NotificationService,
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
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    try {
      const clientName = `${event.prenom} ${event.nom}`.trim();

      await this.notificationService.notifyNewClient(
        event.organisationId,
        SYSTEM_USER_ID,
        event.clientId,
        clientName,
      );

      this.logger.log(`Created notification for new client ${event.clientId}`);
      await this.processedEventsRepo.markProcessed(event.eventId, 'client.created');
    } catch (error) {
      this.logger.error(`Failed to process client.created event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

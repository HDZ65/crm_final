import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';
import { NotificationService } from '../../../persistence/typeorm/repositories/engagement';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';
const SYSTEM_USER_ID = 'system';

@Injectable()
export class NotificationClientCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(NotificationClientCreatedHandler.name);

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
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const prenom = event.prenom ?? (event as any).prenom;
      const nom = event.nom ?? (event as any).nom;
      const organisationId = event.organisation_id ?? (event as any).organisationId;
      const clientId = event.client_id ?? (event as any).clientId;
      const clientName = `${prenom} ${nom}`.trim();

      await this.notificationService.notifyNewClient(
        organisationId,
        SYSTEM_USER_ID,
        clientId,
        clientName,
      );

      this.logger.log(`Created notification for new client ${clientId}`);
      await this.processedEventsRepo.markProcessed(eventId, 'notification.client.created');
    } catch (error) {
      this.logger.error(`Failed to process client.created event ${eventId}: ${error}`);
      throw error;
    }
  }
}

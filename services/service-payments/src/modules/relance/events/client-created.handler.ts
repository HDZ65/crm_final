import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';
const FOLLOW_UP_DAYS = 7;

@Injectable()
export class ClientCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(ClientCreatedHandler.name);

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
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + FOLLOW_UP_DAYS);

      this.logger.log(
        `Scheduled follow-up for client ${event.clientId} (${event.prenom} ${event.nom}) on ${followUpDate.toISOString().split('T')[0]} (J+${FOLLOW_UP_DAYS})`,
      );

      await this.processedEventsRepo.markProcessed(event.eventId, 'client.created');
    } catch (error) {
      this.logger.error(`Failed to process client.created event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';

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
      if (event.email) {
        this.logger.log(
          `Welcome email queued for ${event.email} (client: ${event.prenom} ${event.nom}, id: ${event.clientId})`,
        );
      } else {
        this.logger.log(`Client ${event.clientId} created without email, skipping welcome email`);
      }

      await this.processedEventsRepo.markProcessed(event.eventId, 'client.created');
    } catch (error) {
      this.logger.error(`Failed to process client.created event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

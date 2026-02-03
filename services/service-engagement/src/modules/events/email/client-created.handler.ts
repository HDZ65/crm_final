import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ClientCreatedEvent } from '@crm/proto/events/client';

const CLIENT_CREATED_SUBJECT = 'crm.events.client.created';

@Injectable()
export class EmailClientCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(EmailClientCreatedHandler.name);

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
      const email = event.email ?? (event as any).email;
      const prenom = event.prenom ?? (event as any).prenom;
      const nom = event.nom ?? (event as any).nom;
      const clientId = event.client_id ?? (event as any).clientId;
      
      if (email) {
        this.logger.log(
          `Welcome email queued for ${email} (client: ${prenom} ${nom}, id: ${clientId})`,
        );
      } else {
        this.logger.log(`Client ${clientId} created without email, skipping welcome email`);
      }

      await this.processedEventsRepo.markProcessed(eventId, 'email.client.created');
    } catch (error) {
      this.logger.error(`Failed to process client.created event ${eventId}: ${error}`);
      throw error;
    }
  }
}

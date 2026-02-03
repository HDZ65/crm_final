import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ContractSignedEvent } from '@crm/proto/events/contract';

const CONTRACT_SIGNED_SUBJECT = 'crm.events.contract.signed';

@Injectable()
export class EmailContractSignedHandler implements OnModuleInit {
  private readonly logger = new Logger(EmailContractSignedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribeProto<ContractSignedEvent>(
      CONTRACT_SIGNED_SUBJECT,
      ContractSignedEvent,
      (event) => this.handleContractSigned(event),
    );
    this.logger.log(`Subscribed to ${CONTRACT_SIGNED_SUBJECT}`);
  }

  private async handleContractSigned(event: ContractSignedEvent): Promise<void> {
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const contratId = event.contrat_id ?? (event as any).contratId;
      const clientId = event.client_id ?? (event as any).clientId;
      
      this.logger.log(
        `Sending contract signature confirmation email for contract ${contratId}, client ${clientId}`,
      );

      await this.processedEventsRepo.markProcessed(eventId, 'email.contract.signed');
    } catch (error) {
      this.logger.error(`Failed to process contract.signed event ${eventId}: ${error}`);
      throw error;
    }
  }
}

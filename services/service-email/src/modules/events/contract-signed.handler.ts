import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { ContractSignedEvent } from '@crm/proto/events/contract';

const CONTRACT_SIGNED_SUBJECT = 'crm.events.contract.signed';

@Injectable()
export class ContractSignedHandler implements OnModuleInit {
  private readonly logger = new Logger(ContractSignedHandler.name);

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
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    try {
      this.logger.log(
        `Sending contract signature confirmation email for contract ${event.contratId}, client ${event.clientId}`,
      );

      await this.processedEventsRepo.markProcessed(event.eventId, 'contract.signed');
    } catch (error) {
      this.logger.error(`Failed to process contract.signed event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

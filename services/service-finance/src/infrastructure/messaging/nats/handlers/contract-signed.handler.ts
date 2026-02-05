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
    const exists = await this.processedEventsRepo.exists(event.event_id);
    if (exists) {
      this.logger.debug(`Event ${event.event_id} already processed, skipping`);
      return;
    }

    try {
      this.logger.log(
        `Creating payment schedule for contract ${event.contrat_id}, client ${event.client_id}, amount ${event.montant_total}`,
      );

      await this.processedEventsRepo.markProcessed(event.event_id, 'contract.signed');
    } catch (error) {
      this.logger.error(`Failed to process contract.signed event ${event.event_id}: ${error}`);
      throw error;
    }
  }
}

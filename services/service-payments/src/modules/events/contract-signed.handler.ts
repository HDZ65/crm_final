import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { ContractSignedEvent } from '@crm/proto/events/contract';
import { ProcessedEventsRepository } from '@crm/nats-utils';

@Injectable()
export class ContractSignedHandler {
  private readonly logger = new Logger(ContractSignedHandler.name);

  constructor(
    private readonly processedEventsRepo: ProcessedEventsRepository,
  ) {}

  @EventPattern('crm.events.contract.signed')
  async handle(@Payload() event: ContractSignedEvent, @Ctx() context: NatsContext) {
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    this.logger.log(`Contract signed: ${event.contratId}, creating payment schedule`);
    
    // TODO: Create payment schedule based on contract terms
    
    await this.processedEventsRepo.markProcessed(event.eventId, 'contract.signed');
  }
}

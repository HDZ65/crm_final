import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { PaymentRejectedEvent } from '@crm/proto/events/payment';
import { ProcessedEventsRepository } from '@crm/nats-utils';

@Injectable()
export class PaymentRejectedHandler {
  private readonly logger = new Logger(PaymentRejectedHandler.name);

  constructor(
    private readonly processedEventsRepo: ProcessedEventsRepository,
  ) {}

  @EventPattern('crm.events.payment.rejected')
  async handle(@Payload() event: PaymentRejectedEvent, @Ctx() context: NatsContext) {
    const exists = await this.processedEventsRepo.exists(event.event_id);
    if (exists) {
      this.logger.debug(`Event ${event.event_id} already processed, skipping`);
      return;
    }

    this.logger.log(`Payment rejected: ${event.payment_id}, scheduling immediate follow-up`);
    
    // TODO: Schedule immediate follow-up with client
    
    await this.processedEventsRepo.markProcessed(event.event_id, 'payment.rejected');
  }
}

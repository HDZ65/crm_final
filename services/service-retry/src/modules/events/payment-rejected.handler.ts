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
    // Idempotency check
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    this.logger.log(`Payment rejected: ${event.paymentId}, scheduling retry`);
    
    // TODO: Add payment to retry queue
    // This would typically add the payment to a retry queue for later processing
    
    // Mark as processed
    await this.processedEventsRepo.markProcessed(event.eventId, 'payment.rejected');
  }
}

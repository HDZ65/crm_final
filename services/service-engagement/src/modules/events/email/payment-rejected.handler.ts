import { Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { PaymentRejectedEvent } from '@crm/proto/events/payment';
import { ProcessedEventsRepository } from '@crm/nats-utils';

@Injectable()
export class EmailPaymentRejectedHandler {
  private readonly logger = new Logger(EmailPaymentRejectedHandler.name);

  constructor(
    private readonly processedEventsRepo: ProcessedEventsRepository,
  ) {}

  @EventPattern('crm.events.payment.rejected')
  async handle(@Payload() event: PaymentRejectedEvent, @Ctx() context: NatsContext) {
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    const paymentId = event.payment_id ?? (event as any).paymentId;
    this.logger.log(`Payment rejected: ${paymentId}, sending email to client`);
    
    await this.processedEventsRepo.markProcessed(eventId, 'email.payment.rejected');
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { PaymentReceivedEvent } from '@crm/proto/events/payment';

const PAYMENT_RECEIVED_SUBJECT = 'crm.events.payment.received';

@Injectable()
export class PaymentReceivedHandler implements OnModuleInit {
  private readonly logger = new Logger(PaymentReceivedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribeProto<PaymentReceivedEvent>(
      PAYMENT_RECEIVED_SUBJECT,
      PaymentReceivedEvent,
      (event) => this.handlePaymentReceived(event),
    );
    this.logger.log(`Subscribed to ${PAYMENT_RECEIVED_SUBJECT}`);
  }

  private async handlePaymentReceived(event: PaymentReceivedEvent): Promise<void> {
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    try {
      this.logger.log(
        `KPI update: Cash flow +${event.montant}EUR from payment ${event.paymentId}`,
      );

      await this.processedEventsRepo.markProcessed(event.eventId, 'payment.received');
    } catch (error) {
      this.logger.error(`Failed to process payment.received event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

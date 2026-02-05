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
    const exists = await this.processedEventsRepo.exists(event.event_id);
    if (exists) {
      this.logger.debug(`Event ${event.event_id} already processed, skipping`);
      return;
    }

    try {
      this.logger.log(
        `Commission calculation triggered for payment ${event.payment_id} - ${event.montant}EUR from client ${event.client_id}`,
      );

      await this.processedEventsRepo.markProcessed(event.event_id, 'payment.received');
    } catch (error) {
      this.logger.error(`Failed to process payment.received event ${event.event_id}: ${error}`);
      throw error;
    }
  }
}

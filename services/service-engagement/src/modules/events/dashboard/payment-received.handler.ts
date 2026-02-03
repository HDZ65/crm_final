import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { PaymentReceivedEvent } from '@crm/proto/events/payment';

const PAYMENT_RECEIVED_SUBJECT = 'crm.events.payment.received';

@Injectable()
export class DashboardPaymentReceivedHandler implements OnModuleInit {
  private readonly logger = new Logger(DashboardPaymentReceivedHandler.name);

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
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const paymentId = event.payment_id ?? (event as any).paymentId;
      const montant = event.montant ?? (event as any).montant;
      
      this.logger.log(
        `KPI update: Cash flow +${montant}EUR from payment ${paymentId}`,
      );

      await this.processedEventsRepo.markProcessed(eventId, 'dashboard.payment.received');
    } catch (error) {
      this.logger.error(`Failed to process payment.received event ${eventId}: ${error}`);
      throw error;
    }
  }
}

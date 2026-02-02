import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { PaymentReceivedEvent } from '@crm/proto/events/payment';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

const PAYMENT_RECEIVED_SUBJECT = 'crm.events.payment.received';
const SYSTEM_USER_ID = 'system';
const FINANCE_TEAM_ORG_ID = 'default';

@Injectable()
export class PaymentReceivedHandler implements OnModuleInit {
  private readonly logger = new Logger(PaymentReceivedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
    private readonly notificationService: NotificationService,
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
      await this.notificationService.create({
        organisationId: FINANCE_TEAM_ORG_ID,
        utilisateurId: SYSTEM_USER_ID,
        type: NotificationType.INFO,
        titre: 'Paiement recu',
        message: `Paiement de ${event.montant}EUR recu pour le client ${event.clientId}`,
        metadata: {
          paymentId: event.paymentId,
          scheduleId: event.scheduleId,
          clientId: event.clientId,
          montant: event.montant,
        },
        lienUrl: `/payments/${event.paymentId}`,
      });

      this.logger.log(`Created notification for payment ${event.paymentId}`);
      await this.processedEventsRepo.markProcessed(event.eventId, 'payment.received');
    } catch (error) {
      this.logger.error(`Failed to process payment.received event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

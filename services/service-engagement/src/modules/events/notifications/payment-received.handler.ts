import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { PaymentReceivedEvent } from '@crm/proto/events/payment';
import { NotificationService } from '../../notifications/notification/notification.service';
import { NotificationType } from '../../notifications/notification/entities/notification.entity';

const PAYMENT_RECEIVED_SUBJECT = 'crm.events.payment.received';
const SYSTEM_USER_ID = 'system';
const FINANCE_TEAM_ORG_ID = 'default';

@Injectable()
export class NotificationPaymentReceivedHandler implements OnModuleInit {
  private readonly logger = new Logger(NotificationPaymentReceivedHandler.name);

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
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const paymentId = event.payment_id ?? (event as any).paymentId;
      const scheduleId = event.schedule_id ?? (event as any).scheduleId;
      const clientId = event.client_id ?? (event as any).clientId;
      const montant = event.montant ?? (event as any).montant;
      
      await this.notificationService.create({
        organisationId: FINANCE_TEAM_ORG_ID,
        utilisateurId: SYSTEM_USER_ID,
        type: NotificationType.INFO,
        titre: 'Paiement recu',
        message: `Paiement de ${montant}EUR recu pour le client ${clientId}`,
        metadata: {
          paymentId,
          scheduleId,
          clientId,
          montant,
        },
        lienUrl: `/payments/${paymentId}`,
      });

      this.logger.log(`Created notification for payment ${paymentId}`);
      await this.processedEventsRepo.markProcessed(eventId, 'notification.payment.received');
    } catch (error) {
      this.logger.error(`Failed to process payment.received event ${eventId}: ${error}`);
      throw error;
    }
  }
}

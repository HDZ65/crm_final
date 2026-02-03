import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { InvoiceCreatedEvent } from '@crm/proto/events/invoice';
import { NotificationService } from '../../notifications/notification/notification.service';
import { NotificationType } from '../../notifications/notification/entities/notification.entity';

const INVOICE_CREATED_SUBJECT = 'crm.events.invoice.created';
const SYSTEM_USER_ID = 'system';
const FINANCE_TEAM_ORG_ID = 'default';

@Injectable()
export class NotificationInvoiceCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(NotificationInvoiceCreatedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribeProto<InvoiceCreatedEvent>(
      INVOICE_CREATED_SUBJECT,
      InvoiceCreatedEvent,
      (event) => this.handleInvoiceCreated(event),
    );
    this.logger.log(`Subscribed to ${INVOICE_CREATED_SUBJECT}`);
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    const eventId = event.event_id ?? (event as any).eventId;
    const exists = await this.processedEventsRepo.exists(eventId);
    if (exists) {
      this.logger.debug(`Event ${eventId} already processed, skipping`);
      return;
    }

    try {
      const invoiceId = event.invoice_id ?? (event as any).invoiceId;
      const clientId = event.client_id ?? (event as any).clientId;
      const montant = event.montant ?? (event as any).montant;
      
      await this.notificationService.create({
        organisationId: FINANCE_TEAM_ORG_ID,
        utilisateurId: SYSTEM_USER_ID,
        type: NotificationType.INFO,
        titre: 'Nouvelle facture',
        message: `Facture ${invoiceId} creee pour ${montant}EUR`,
        metadata: {
          invoiceId,
          clientId,
          montant,
        },
        lienUrl: `/factures/${invoiceId}`,
      });

      this.logger.log(`Created notification for invoice ${invoiceId}`);
      await this.processedEventsRepo.markProcessed(eventId, 'notification.invoice.created');
    } catch (error) {
      this.logger.error(`Failed to process invoice.created event ${eventId}: ${error}`);
      throw error;
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { InvoiceCreatedEvent } from '@crm/proto/events/invoice';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

const INVOICE_CREATED_SUBJECT = 'crm.events.invoice.created';
const SYSTEM_USER_ID = 'system';
const FINANCE_TEAM_ORG_ID = 'default';

@Injectable()
export class InvoiceCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(InvoiceCreatedHandler.name);

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
     const exists = await this.processedEventsRepo.exists(event.event_id);
     if (exists) {
       this.logger.debug(`Event ${event.event_id} already processed, skipping`);
       return;
     }

     try {
       await this.notificationService.create({
         organisationId: FINANCE_TEAM_ORG_ID,
         utilisateurId: SYSTEM_USER_ID,
         type: NotificationType.INFO,
         titre: 'Nouvelle facture',
         message: `Facture ${event.invoice_id} créée pour ${event.montant}EUR`,
         metadata: {
           invoiceId: event.invoice_id,
           clientId: event.client_id,
           montant: event.montant,
         },
         lienUrl: `/factures/${event.invoice_id}`,
       });

       this.logger.log(`Created notification for invoice ${event.invoice_id}`);
       await this.processedEventsRepo.markProcessed(event.event_id, 'invoice.created');
     } catch (error) {
       this.logger.error(`Failed to process invoice.created event ${event.event_id}: ${error}`);
       throw error;
     }
   }
}

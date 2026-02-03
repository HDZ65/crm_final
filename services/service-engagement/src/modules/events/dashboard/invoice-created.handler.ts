import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { InvoiceCreatedEvent } from '@crm/proto/events/invoice';

const INVOICE_CREATED_SUBJECT = 'crm.events.invoice.created';

@Injectable()
export class DashboardInvoiceCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(DashboardInvoiceCreatedHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly processedEventsRepo: ProcessedEventsRepository,
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
      const montant = event.montant ?? (event as any).montant;
      
      this.logger.log(
        `KPI update: Revenue +${montant}EUR from invoice ${invoiceId}`,
      );

      await this.processedEventsRepo.markProcessed(eventId, 'dashboard.invoice.created');
    } catch (error) {
      this.logger.error(`Failed to process invoice.created event ${eventId}: ${error}`);
      throw error;
    }
  }
}

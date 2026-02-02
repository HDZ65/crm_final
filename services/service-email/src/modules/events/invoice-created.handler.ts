import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { InvoiceCreatedEvent } from '@crm/proto/events/invoice';

const INVOICE_CREATED_SUBJECT = 'crm.events.invoice.created';

@Injectable()
export class InvoiceCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(InvoiceCreatedHandler.name);

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
    const exists = await this.processedEventsRepo.exists(event.eventId);
    if (exists) {
      this.logger.debug(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    try {
      this.logger.log(
        `Invoice PDF email queued for invoice ${event.invoiceId} (client: ${event.clientId}, amount: ${event.montant}EUR)`,
      );

      await this.processedEventsRepo.markProcessed(event.eventId, 'invoice.created');
    } catch (error) {
      this.logger.error(`Failed to process invoice.created event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

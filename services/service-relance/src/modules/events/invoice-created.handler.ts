import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, ProcessedEventsRepository } from '@crm/nats-utils';
import { InvoiceCreatedEvent } from '@crm/proto/events/invoice';

const INVOICE_CREATED_SUBJECT = 'crm.events.invoice.created';
const REMINDER_DAYS_BEFORE_DUE = 15;

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
      let reminderDate: Date | null = null;

      if (event.dateEcheance?.seconds) {
        const dueDate = new Date(event.dateEcheance.seconds * 1000);
        reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - REMINDER_DAYS_BEFORE_DUE);
      }

      if (reminderDate && reminderDate > new Date()) {
        this.logger.log(
          `Scheduled payment reminder for invoice ${event.invoiceId} on ${reminderDate.toISOString().split('T')[0]} (J-${REMINDER_DAYS_BEFORE_DUE} before due date)`,
        );
      } else {
        this.logger.log(
          `Invoice ${event.invoiceId} created without valid due date, skipping reminder scheduling`,
        );
      }

      await this.processedEventsRepo.markProcessed(event.eventId, 'invoice.created');
    } catch (error) {
      this.logger.error(`Failed to process invoice.created event ${event.eventId}: ${error}`);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  CatalogueWebhookEventEntity,
  CatalogueWebhookProcessingStatus,
} from '../entities/catalogue-webhook-event.entity';
import { WebhookEventType } from '../enums/webhook-event-type.enum';
import { CommissionReportEventHandler } from '../handlers/commission-report-event.handler';
import { PolicyEventHandler } from '../handlers/policy-event.handler';
import { QuoteEventHandler } from '../handlers/quote-event.handler';

@Injectable()
export class WebhookEventDispatchService {
  private readonly logger = new Logger(WebhookEventDispatchService.name);
  private readonly eventRepository: Repository<CatalogueWebhookEventEntity>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly quoteEventHandler: QuoteEventHandler,
    private readonly policyEventHandler: PolicyEventHandler,
    private readonly commissionReportEventHandler: CommissionReportEventHandler,
  ) {
    this.eventRepository = this.dataSource.getRepository(CatalogueWebhookEventEntity);
  }

  async dispatchEvent(eventId: string): Promise<{ success: boolean; status: string }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      return { success: false, status: 'not_found' };
    }

    try {
      event.markProcessing();
      await this.eventRepository.save(event);

      const result = await this.dispatchToHandler(event);
      if (!result.success) {
        event.markFailed(result.error || 'Webhook handler failed');
        await this.eventRepository.save(event);
        return { success: false, status: 'failed' };
      }

      event.markDone();
      await this.eventRepository.save(event);
      return { success: true, status: 'done' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to dispatch webhook event ${event.id}: ${errorMessage}`);
      event.markFailed(errorMessage);
      await this.eventRepository.save(event);
      return { success: false, status: 'failed' };
    }
  }

  private async dispatchToHandler(event: CatalogueWebhookEventEntity): Promise<{ success: boolean; error?: string }> {
    const eventType = this.normalizeEventType(event.eventType);

    if (!eventType) {
      return { success: false, error: `Unsupported webhook event type: ${event.eventType}` };
    }

    if (eventType === WebhookEventType.QUOTE) {
      return this.quoteEventHandler.handle(event.payload || {});
    }

    if (
      eventType === WebhookEventType.ISSUE_POLICY ||
      eventType === WebhookEventType.CANCEL ||
      eventType === WebhookEventType.RENEWAL
    ) {
      return this.policyEventHandler.handle({
        ...(event.payload || {}),
        __eventType: eventType,
      });
    }

    if (eventType === WebhookEventType.COMMISSION_REPORT) {
      return this.commissionReportEventHandler.handle(event.payload || {});
    }

    return { success: false, error: `No handler registered for event type: ${event.eventType}` };
  }

  private normalizeEventType(rawType: string): WebhookEventType | null {
    const canonical = rawType.replace(/[_\-\s]/g, '').toLowerCase();
    if (canonical === 'quote') return WebhookEventType.QUOTE;
    if (canonical === 'issuepolicy') return WebhookEventType.ISSUE_POLICY;
    if (canonical === 'cancel') return WebhookEventType.CANCEL;
    if (canonical === 'renewal') return WebhookEventType.RENEWAL;
    if (canonical === 'commissionreport') return WebhookEventType.COMMISSION_REPORT;
    return null;
  }

  async retryEvent(eventId: string): Promise<{ success: boolean; status: string }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      return { success: false, status: 'not_found' };
    }

    if (event.processingStatus === CatalogueWebhookProcessingStatus.DONE) {
      return { success: true, status: 'done' };
    }

    event.incrementRetry();
    event.processingStatus = CatalogueWebhookProcessingStatus.RECEIVED;
    event.errorMessage = null;
    await this.eventRepository.save(event);

    return this.dispatchEvent(event.id);
  }

  async retryFailed(limit = 50): Promise<number> {
    const failedEvents = await this.eventRepository.find({
      where: { processingStatus: CatalogueWebhookProcessingStatus.FAILED },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    let retried = 0;
    for (const event of failedEvents) {
      const result = await this.retryEvent(event.id);
      if (result.success) {
        retried += 1;
      }
    }

    return retried;
  }
}

import {
  CatalogueWebhookEventEntity,
  CatalogueWebhookProcessingStatus,
} from '../entities/catalogue-webhook-event.entity';

export interface ICatalogueWebhookEventRepository {
  findById(id: string): Promise<CatalogueWebhookEventEntity | null>;
  findByEventId(eventId: string): Promise<CatalogueWebhookEventEntity | null>;
  isEventProcessed(eventId: string): Promise<boolean>;
  findByStatus(
    status: CatalogueWebhookProcessingStatus,
    limit?: number,
  ): Promise<CatalogueWebhookEventEntity[]>;
  create(input: {
    organisationId: string;
    eventId: string;
    eventType: string;
    payload: Record<string, any>;
    apiKeyValid: boolean;
    processingStatus?: CatalogueWebhookProcessingStatus;
  }): Promise<CatalogueWebhookEventEntity>;
  save(entity: CatalogueWebhookEventEntity): Promise<CatalogueWebhookEventEntity>;
  markProcessing(id: string): Promise<void>;
  markDone(id: string, processedAt?: Date): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  incrementRetryCount(id: string): Promise<void>;
}

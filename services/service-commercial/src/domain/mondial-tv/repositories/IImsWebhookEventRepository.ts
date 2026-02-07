import {
  ImsWebhookEventEntity,
  ImsWebhookProcessingStatus,
} from '../entities/ims-webhook-event.entity';

export interface IImsWebhookEventRepository {
  findById(id: string): Promise<ImsWebhookEventEntity | null>;
  findByEventId(eventId: string): Promise<ImsWebhookEventEntity | null>;
  isEventProcessed(eventId: string): Promise<boolean>;
  findByStatus(
    status: ImsWebhookProcessingStatus,
    limit?: number,
  ): Promise<ImsWebhookEventEntity[]>;
  create(input: {
    organisationId: string;
    eventId: string;
    eventType: string;
    payload: Record<string, any>;
    hmacValid: boolean;
    processingStatus?: ImsWebhookProcessingStatus;
  }): Promise<ImsWebhookEventEntity>;
  save(entity: ImsWebhookEventEntity): Promise<ImsWebhookEventEntity>;
  markProcessing(id: string): Promise<void>;
  markDone(id: string, processedAt?: Date): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  incrementRetryCount(id: string): Promise<void>;
}

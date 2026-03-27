import { WooCommerceWebhookEventEntity, WebhookEventStatus } from '../entities/woocommerce-webhook-event.entity';

export interface IWooCommerceWebhookEventRepository {
  findById(id: string): Promise<WooCommerceWebhookEventEntity | null>;
  findByExternalEventId(source: string, externalEventId: string): Promise<WooCommerceWebhookEventEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    eventType?: string;
    status?: WebhookEventStatus;
  }): Promise<WooCommerceWebhookEventEntity[]>;
  findPendingEvents(limit?: number): Promise<WooCommerceWebhookEventEntity[]>;
  findFailedEvents(maxRetries: number): Promise<WooCommerceWebhookEventEntity[]>;
  save(entity: WooCommerceWebhookEventEntity): Promise<WooCommerceWebhookEventEntity>;
  create(input: {
    organisationId: string;
    source: string;
    externalEventId: string;
    eventType: string;
    wooResourceId: string;
    rawPayload: Record<string, any>;
    signature?: string;
    status?: WebhookEventStatus;
  }): Promise<WooCommerceWebhookEventEntity>;
  markVerified(id: string): Promise<void>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  markDuplicate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

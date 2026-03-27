import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { WooCommerceWebhookService } from '../../../domain/woocommerce/services/woocommerce-webhook.service';

/**
 * gRPC controller for WooCommerce webhook operations.
 * The main HTTP webhook endpoint is at infrastructure/http/woocommerce/webhook.controller.ts.
 * This controller exposes gRPC RPCs for retry and event listing.
 */
@Controller()
export class WooCommerceController {
  private readonly logger = new Logger(WooCommerceController.name);

  constructor(
    private readonly webhookService: WooCommerceWebhookService,
  ) {}

  @GrpcMethod('WooCommerceWebhookService', 'RetryWebhookEvent')
  async retryWebhookEvent(request: { id: string }): Promise<{
    success: boolean;
    message: string;
    event_id: string;
  }> {
    const result = await this.webhookService.retryEvent(request.id);
    return {
      success: result.success,
      message: result.message,
      event_id: result.eventId || '',
    };
  }

  @GrpcMethod('WooCommerceWebhookService', 'ListWebhookEvents')
  async listWebhookEvents(data: {
    organisation_id: string;
    event_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const events = await this.webhookService.listEvents({
      organisationId: data.organisation_id,
      eventType: data.event_type || undefined,
    });
    return {
      events: events.map((e) => ({
        id: e.id,
        organisation_id: e.organisationId,
        source: e.source,
        external_event_id: e.externalEventId || '',
        topic: e.eventType,
        payload: typeof e.rawPayload === 'object' ? JSON.stringify(e.rawPayload) : String(e.rawPayload || ''),
        status: e.status,
        created_at: e.createdAt?.toISOString() ?? '',
        processed_at: e.processedAt?.toISOString() ?? '',
        retry_count: e.retryCount || 0,
        error_message: e.errorMessage || '',
      })),
      total: events.length,
    };
  }
}

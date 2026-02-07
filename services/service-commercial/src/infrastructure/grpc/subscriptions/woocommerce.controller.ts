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
}

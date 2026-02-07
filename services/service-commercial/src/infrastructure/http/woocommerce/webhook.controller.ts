import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHmac } from 'crypto';
import { NatsService } from '@crm/shared-kernel';
import { WooCommerceWebhookEventService } from '../../persistence/typeorm/repositories/woocommerce/woocommerce-webhook-event.service';
import { WooCommerceConfigService } from '../../persistence/typeorm/repositories/woocommerce/woocommerce-config.service';

@Controller('webhooks')
export class WooCommerceWebhookController {
  private readonly logger = new Logger(WooCommerceWebhookController.name);

  constructor(
    private readonly webhookEventService: WooCommerceWebhookEventService,
    private readonly configService: WooCommerceConfigService,
    private readonly natsService: NatsService,
  ) {}

  @Post('woocommerce')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
    @Headers('x-wc-webhook-signature') signature: string,
    @Headers('x-wc-webhook-topic') topic: string,
    @Headers('x-wc-webhook-delivery') deliveryId: string,
  ) {
    this.logger.log(`Received WooCommerce webhook: ${topic} (${deliveryId})`);

    // Extract organization ID from payload (adjust based on actual WC payload structure)
    const organisationId = payload.meta_data?.find(
      (m: any) => m.key === 'organisation_id',
    )?.value;

    if (!organisationId) {
      this.logger.warn('No organisation_id in webhook payload');
      return { success: false, error: 'Missing organisation_id' };
    }

    // Check for duplicate
    const existing = await this.webhookEventService.findByExternalEventId(
      'woocommerce',
      deliveryId,
    );
    if (existing) {
      this.logger.log(`Duplicate webhook detected: ${deliveryId}`);
      await this.webhookEventService.markDuplicate(existing.id);
      return { success: true, status: 'duplicate' };
    }

    // Get webhook secret for this organization
    const config = await this.configService.findByOrganisation(organisationId);
    if (!config) {
      this.logger.warn(
        `No WooCommerce config for organisation ${organisationId}`,
      );
      return { success: false, error: 'No WooCommerce configuration' };
    }

    // Verify HMAC signature
    const rawBody =
      req.rawBody?.toString('utf8') || JSON.stringify(payload);
    const expectedSignature = createHmac('sha256', config.webhookSecret)
      .update(rawBody)
      .digest('base64');

    if (signature !== expectedSignature) {
      this.logger.warn(
        `Invalid webhook signature for delivery ${deliveryId}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Extract resource ID from payload
    const wooResourceId = String(
      payload.id || payload.resource_id || 'unknown',
    );

    // Store event with RECEIVED status
    const event = await this.webhookEventService.create({
      organisationId,
      source: 'woocommerce',
      externalEventId: deliveryId,
      eventType: topic,
      wooResourceId,
      rawPayload: payload,
      signature,
    });

    // Mark as VERIFIED after signature check
    await this.webhookEventService.markVerified(event.id);

    // Publish to NATS
    if (this.natsService.isConnected()) {
      await this.natsService.publish(
        'crm.commercial.woocommerce.webhook.received',
        {
          eventId: event.id,
          organisationId,
          topic,
          deliveryId,
          wooResourceId,
          payload,
        },
      );
    } else {
      this.logger.warn(
        'NATS not connected, webhook stored but not published',
      );
    }

    this.logger.log(`Webhook processed successfully: ${deliveryId}`);
    return { success: true, eventId: event.id };
  }
}

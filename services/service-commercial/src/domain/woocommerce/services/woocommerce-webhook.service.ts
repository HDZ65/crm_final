import { Injectable, Logger, Optional } from '@nestjs/common';
import { createHmac } from 'crypto';
import { NatsService } from '@crm/shared-kernel';
import type { IWooCommerceWebhookEventRepository } from '../repositories/IWooCommerceWebhookEventRepository';
import type { IWooCommerceConfigRepository } from '../repositories/IWooCommerceConfigRepository';
import { WebhookEventStatus } from '../entities/woocommerce-webhook-event.entity';

export interface WebhookRequest {
  organisationId: string;
  signature: string;
  deliveryId: string;
  topic: string;
  resource: string;
  body: string; // raw body string for signature validation
  payload: Record<string, any>;
}

export interface WebhookResult {
  success: boolean;
  eventId?: string;
  message: string;
  status?: string;
}

/**
 * Maps WooCommerce webhook topics to NATS subjects.
 */
const TOPIC_TO_NATS_SUBJECT: Record<string, string> = {
  'customer.created': 'woocommerce.customer.created',
  'customer.updated': 'woocommerce.customer.created', // treat update as upsert
  'subscription.created': 'woocommerce.subscription.created',
  'subscription.updated': 'woocommerce.subscription.updated',
  'order.completed': 'woocommerce.order.completed',
  'order.updated': 'woocommerce.order.completed', // fallback
  'payment_intent.succeeded': 'woocommerce.payment_intent.succeeded',
};

@Injectable()
export class WooCommerceWebhookService {
  private readonly logger = new Logger(WooCommerceWebhookService.name);

  constructor(
    private readonly webhookEventRepository: IWooCommerceWebhookEventRepository,
    private readonly configRepository: IWooCommerceConfigRepository,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  /**
   * Validates WooCommerce HMAC-SHA256 signature.
   */
  validateSignature(body: string, signature: string, secret: string): boolean {
    const computed = createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    return computed === signature;
  }

  /**
   * Receives a webhook, validates signature, stores event, publishes to NATS.
   */
  async processWebhook(request: WebhookRequest): Promise<WebhookResult> {
    // 1. Load config for the organisation
    const config = await this.configRepository.findByOrganisationId(request.organisationId);
    if (!config || !config.active) {
      return { success: false, message: 'WooCommerce config not found or inactive' };
    }

    // 2. Check for duplicate by delivery ID
    if (request.deliveryId) {
      const existing = await this.webhookEventRepository.findByExternalEventId(
        'woocommerce',
        request.deliveryId,
      );
      if (existing) {
        await this.webhookEventRepository.markDuplicate(existing.id);
        return { success: true, message: 'Duplicate webhook', status: 'duplicate' };
      }
    }

    // 3. Validate HMAC signature
    const isValid = this.validateSignature(
      request.body,
      request.signature,
      config.webhookSecret,
    );

    if (!isValid) {
      this.logger.warn(
        `Invalid webhook signature for organisation ${request.organisationId}`,
      );
      return { success: false, message: 'Invalid signature' };
    }

    // 4. Extract WooCommerce resource ID
    const wooResourceId = this.extractResourceId(request.payload);

    // 5. Store event using repository's create method
    const savedEvent = await this.webhookEventRepository.create({
      organisationId: request.organisationId,
      source: 'woocommerce',
      externalEventId: request.deliveryId || `manual-${Date.now()}`,
      eventType: request.topic,
      wooResourceId,
      rawPayload: request.payload,
      signature: request.signature,
    });

    // 6. Mark as verified after signature check
    await this.webhookEventRepository.markVerified(savedEvent.id);

    // 7. Publish to NATS for async processing
    const natsSubject = this.resolveNatsSubject(request.topic);
    if (natsSubject) {
      await this.publishToNats(natsSubject, {
        eventId: savedEvent.id,
        organisationId: request.organisationId,
        topic: request.topic,
        wooResourceId,
        payload: request.payload,
      });
    }

    return {
      success: true,
      eventId: savedEvent.id,
      message: 'Webhook received and queued',
    };
  }

  /**
   * Retries a failed webhook event.
   */
  async retryEvent(eventId: string): Promise<WebhookResult> {
    const event = await this.webhookEventRepository.findById(eventId);
    if (!event) {
      return { success: false, message: 'Event not found' };
    }

    if (event.status !== WebhookEventStatus.FAILED) {
      return { success: false, message: `Event status is ${event.status}, not FAILED` };
    }

    // Reset to RECEIVED and increment retry
    event.status = WebhookEventStatus.RECEIVED;
    event.retryCount += 1;
    event.errorMessage = null;
    await this.webhookEventRepository.save(event);

    // Republish to NATS
    const natsSubject = this.resolveNatsSubject(event.eventType);
    if (natsSubject) {
      await this.publishToNats(natsSubject, {
        eventId: event.id,
        organisationId: event.organisationId,
        topic: event.eventType,
        wooResourceId: event.wooResourceId,
        payload: event.rawPayload,
      });
    }

    return {
      success: true,
      eventId: event.id,
      message: 'Event re-queued for processing',
    };
  }

  /**
   * Marks an event as processing.
   */
  async markProcessing(eventId: string): Promise<void> {
    const event = await this.webhookEventRepository.findById(eventId);
    if (event) {
      event.markProcessing();
      await this.webhookEventRepository.save(event);
    }
  }

  /**
   * Marks an event as processed (done).
   */
  async markProcessed(eventId: string): Promise<void> {
    await this.webhookEventRepository.markProcessed(eventId);
  }

  /**
   * Marks an event as failed.
   */
  async markFailed(eventId: string, errorMessage: string): Promise<void> {
    await this.webhookEventRepository.markFailed(eventId, errorMessage);
  }

  resolveNatsSubject(topic: string): string | null {
    return TOPIC_TO_NATS_SUBJECT[topic] || null;
  }

  private extractResourceId(payload: Record<string, any>): string {
    return String(payload.id || payload.resource_id || 'unknown');
  }

  private async publishToNats(subject: string, data: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      this.logger.warn(`NATS not connected, skipping publish to ${subject}`);
      return;
    }

    await this.natsService.publish(subject, data);
  }
}

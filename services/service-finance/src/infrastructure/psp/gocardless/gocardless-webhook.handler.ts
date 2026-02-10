import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import {
  PSPEventInboxEntity,
  WebhookEventStatus,
} from '../../../domain/payments/entities/psp-event-inbox.entity';
import { PSPProvider } from '../../../domain/payments/entities/portal-session.entity';
import {
  PaymentEventEntity,
  PaymentEventType,
} from '../../../domain/payments/entities/payment-event.entity';
import { PaymentProvider } from '../../../domain/payments/entities/schedule.entity';
import {
  GoCardlessAccountEntity,
} from '../../../domain/payments/entities/gocardless-account.entity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoCardlessWebhookEvent {
  id: string;
  created_at: string;
  resource_type: string;
  action: string;
  links: Record<string, string>;
  details: {
    origin: string;
    cause: string;
    description: string;
    scheme?: string;
    reason_code?: string;
  };
}

export interface GoCardlessWebhookPayload {
  events: GoCardlessWebhookEvent[];
}

export interface WebhookProcessingResult {
  inboxId: string;
  status: WebhookEventStatus;
  internalStatus?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

@Injectable()
export class GoCardlessWebhookHandler {
  private readonly logger = new Logger(GoCardlessWebhookHandler.name);

  constructor(
    @InjectRepository(PSPEventInboxEntity)
    private readonly inboxRepo: Repository<PSPEventInboxEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    @InjectRepository(GoCardlessAccountEntity)
    private readonly gcAccountRepo: Repository<GoCardlessAccountEntity>,
  ) {}

  // -----------------------------------------------------------------------
  // Main entry point — POST /api/payments/webhooks/gocardless/:companyId
  // -----------------------------------------------------------------------

  async handleWebhook(
    companyId: string,
    rawBody: string,
    signatureHeader: string | undefined,
  ): Promise<WebhookProcessingResult[]> {
    // 1. Parse payload
    let payload: GoCardlessWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as GoCardlessWebhookPayload;
    } catch {
      this.logger.warn(`Invalid JSON in GoCardless webhook for company ${companyId}`);
      return [{ inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Invalid JSON body' }];
    }

    // 2. Fetch account and verify HMAC signature
    const account = await this.gcAccountRepo.findOne({
      where: { societeId: companyId, actif: true },
    });

    if (!account) {
      this.logger.warn(`No active GoCardless account for company ${companyId}`);
      return [{ inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Unknown company' }];
    }

    if (account.hasWebhookSecret()) {
      const isValid = this.verifySignature(rawBody, signatureHeader, account.webhookSecret!);
      if (!isValid) {
        this.logger.warn(`Invalid HMAC signature on GoCardless webhook for company ${companyId}`);
        return [{ inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Invalid signature' }];
      }
    }

    // 3. Process each event in the webhook payload
    const events = payload.events ?? [];
    const results: WebhookProcessingResult[] = [];

    for (const event of events) {
      const result = await this.processEvent(companyId, event, rawBody, signatureHeader);
      results.push(result);
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Signature verification (HMAC-SHA256)
  // -----------------------------------------------------------------------

  private verifySignature(
    rawBody: string,
    signatureHeader: string | undefined,
    secret: string,
  ): boolean {
    if (!signatureHeader) {
      return false;
    }

    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader, 'utf8'),
        Buffer.from(expectedHmac, 'utf8'),
      );
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Single event processing
  // -----------------------------------------------------------------------

  private async processEvent(
    companyId: string,
    event: GoCardlessWebhookEvent,
    rawBody: string,
    signatureHeader: string | undefined,
  ): Promise<WebhookProcessingResult> {
    const eventId = event.id;
    const eventType = `${event.resource_type}.${event.action}`;

    // Idempotence: check PSPEventInbox
    const existing = await this.inboxRepo.findOne({
      where: { pspProvider: PSPProvider.GOCARDLESS, pspEventId: eventId },
    });

    if (existing) {
      this.logger.log(`Duplicate GoCardless webhook event ${eventId}, skipping`);
      existing.markDuplicate();
      await this.inboxRepo.save(existing);
      return { inboxId: existing.id, status: WebhookEventStatus.DUPLICATE, message: 'Duplicate event' };
    }

    // Store in inbox
    const inbox = new PSPEventInboxEntity();
    inbox.pspProvider = PSPProvider.GOCARDLESS;
    inbox.pspEventId = eventId;
    inbox.pspEventType = eventType;
    inbox.rawPayload = JSON.stringify(event);
    inbox.signature = signatureHeader ?? null;
    inbox.status = WebhookEventStatus.RECEIVED;
    inbox.receivedAt = new Date();

    inbox.markVerified();
    const saved = await this.inboxRepo.save(inbox);

    // Map event to internal status
    try {
      const result = await this.mapAndStoreEvent(companyId, event, saved);
      saved.markProcessed();
      await this.inboxRepo.save(saved);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process GoCardless event ${eventId}: ${msg}`);
      saved.markFailed(msg);
      await this.inboxRepo.save(saved);
      return { inboxId: saved.id, status: WebhookEventStatus.FAILED, message: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Event mapping (max 5 types)
  // -----------------------------------------------------------------------

  private async mapAndStoreEvent(
    companyId: string,
    event: GoCardlessWebhookEvent,
    inbox: PSPEventInboxEntity,
  ): Promise<WebhookProcessingResult> {
    const eventType = `${event.resource_type}.${event.action}`;
    const internalStatus = this.mapToInternalStatus(eventType, event.details?.reason_code);
    const paymentEventType = this.toPaymentEventType(eventType);

    // Create PaymentEvent
    const paymentEvent = new PaymentEventEntity();
    paymentEvent.societeId = companyId;
    paymentEvent.provider = PaymentProvider.GOCARDLESS;
    paymentEvent.eventType = paymentEventType;
    paymentEvent.providerEventId = event.id;
    paymentEvent.payload = {
      eventType,
      resourceType: event.resource_type,
      action: event.action,
      cause: event.details?.cause,
      description: event.details?.description,
      reasonCode: event.details?.reason_code,
      internalStatus,
      links: event.links,
    };
    paymentEvent.processed = true;

    await this.paymentEventRepo.save(paymentEvent);

    return {
      inboxId: inbox.id,
      status: WebhookEventStatus.PROCESSED,
      internalStatus,
      message: `Mapped ${eventType} → ${internalStatus}`,
    };
  }

  /**
   * Map GoCardless event types to internal status.
   * Limited to 5 primary event types:
   *
   * 1. payments.confirmed / payments.paid_out → PAID
   * 2. payments.failed → REJECT_OTHER or REJECT_INSUFF_FUNDS
   * 3. payments.cancelled → CANCELLED
   * 4. mandates.active → MANDATE_ACTIVE
   * 5. mandates.cancelled / mandates.failed → MANDATE_CANCELLED
   */
  private mapToInternalStatus(eventType: string, reasonCode?: string): string {
    switch (eventType) {
      // Payment confirmed or paid out
      case 'payments.confirmed':
      case 'payments.paid_out':
        return 'PAID';

      // Payment failed
      case 'payments.failed':
        return reasonCode === 'insufficient_funds'
          ? 'REJECT_INSUFF_FUNDS'
          : 'REJECT_OTHER';

      // Payment cancelled
      case 'payments.cancelled':
        return 'CANCELLED';

      // Mandate activated
      case 'mandates.active':
        return 'MANDATE_ACTIVE';

      // Mandate cancelled or failed
      case 'mandates.cancelled':
      case 'mandates.failed':
        return 'MANDATE_CANCELLED';

      default:
        return 'UNKNOWN';
    }
  }

  private toPaymentEventType(eventType: string): PaymentEventType {
    switch (eventType) {
      case 'payments.confirmed':
      case 'payments.paid_out':
        return PaymentEventType.PAYMENT_SUCCEEDED;

      case 'payments.failed':
        return PaymentEventType.PAYMENT_FAILED;

      case 'payments.cancelled':
        return PaymentEventType.PAYMENT_CANCELLED;

      case 'mandates.active':
        return PaymentEventType.MANDATE_ACTIVE;

      case 'mandates.cancelled':
      case 'mandates.failed':
        return PaymentEventType.MANDATE_CANCELLED;

      default:
        return PaymentEventType.WEBHOOK_RECEIVED;
    }
  }
}

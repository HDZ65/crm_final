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
import {
  ProviderStatusMappingEntity,
} from '../../../domain/payments/entities/provider-status-mapping.entity';
import {
  SlimpayAccountEntity,
} from '../../../domain/payments/entities/slimpay-account.entity';
import { PaymentProvider } from '../../../domain/payments/entities/schedule.entity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlimpayWebhookPayload {
  /** Slimpay event id */
  id: string;
  type: string;
  /** ISO-8601 timestamp */
  dateCreated: string;
  resource?: {
    /** e.g. direct-debit, mandate */
    type?: string;
    reference?: string;
    id?: string;
    executionStatus?: string;
    rejectReasonCode?: string;
    rejectReason?: string;
    [key: string]: any;
  };
  [key: string]: any;
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

/** Max allowed age for webhook timestamps (5 minutes). */
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;

@Injectable()
export class SlimpayWebhookHandler {
  private readonly logger = new Logger(SlimpayWebhookHandler.name);

  constructor(
    @InjectRepository(PSPEventInboxEntity)
    private readonly inboxRepo: Repository<PSPEventInboxEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    @InjectRepository(ProviderStatusMappingEntity)
    private readonly statusMappingRepo: Repository<ProviderStatusMappingEntity>,
    @InjectRepository(SlimpayAccountEntity)
    private readonly slimpayAccountRepo: Repository<SlimpayAccountEntity>,
  ) {}

  // -----------------------------------------------------------------------
  // Main entry point — POST /api/payments/webhooks/slimpay/:companyId
  // -----------------------------------------------------------------------

  async handleWebhook(
    companyId: string,
    rawBody: string,
    signatureHeader: string | undefined,
  ): Promise<WebhookProcessingResult> {
    // 1. Parse payload
    let payload: SlimpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as SlimpayWebhookPayload;
    } catch {
      this.logger.warn(`Invalid JSON in Slimpay webhook for company ${companyId}`);
      return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Invalid JSON body' };
    }

    const eventId = payload.id ?? crypto.randomUUID();

    // 2. Verify HMAC signature
    const account = await this.slimpayAccountRepo.findOne({
      where: { societeId: companyId, actif: true },
    });

    if (!account) {
      this.logger.warn(`No active Slimpay account for company ${companyId}`);
      return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Unknown company' };
    }

    if (account.hasWebhookSecret()) {
      const isValid = this.verifySignature(rawBody, signatureHeader, account.webhookSecret!);
      if (!isValid) {
        this.logger.warn(`Invalid HMAC signature on Slimpay webhook ${eventId}`);
        return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Invalid signature' };
      }
    }

    // 3. Anti-replay: reject if timestamp > 5 minutes old
    if (payload.dateCreated) {
      const eventTime = new Date(payload.dateCreated).getTime();
      if (Number.isFinite(eventTime) && Date.now() - eventTime > MAX_TIMESTAMP_AGE_MS) {
        this.logger.warn(`Stale Slimpay webhook ${eventId}: timestamp ${payload.dateCreated}`);
        return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Stale timestamp (anti-replay)' };
      }
    }

    // 4. Idempotence: check PSPEventInbox
    const existing = await this.inboxRepo.findOne({
      where: { pspProvider: PSPProvider.SLIMPAY, pspEventId: eventId },
    });

    if (existing) {
      this.logger.log(`Duplicate Slimpay webhook ${eventId}, skipping`);
      existing.markDuplicate();
      await this.inboxRepo.save(existing);
      return { inboxId: existing.id, status: WebhookEventStatus.DUPLICATE, message: 'Duplicate event' };
    }

    // 5. Store in inbox
    const inbox = new PSPEventInboxEntity();
    inbox.pspProvider = PSPProvider.SLIMPAY;
    inbox.pspEventId = eventId;
    inbox.pspEventType = payload.type ?? null;
    inbox.rawPayload = rawBody;
    inbox.signature = signatureHeader ?? null;
    inbox.status = WebhookEventStatus.RECEIVED;
    inbox.receivedAt = new Date();

    inbox.markVerified();
    const saved = await this.inboxRepo.save(inbox);

    // 6. Process status change
    try {
      const result = await this.processEvent(companyId, payload, saved);
      saved.markProcessed();
      await this.inboxRepo.save(saved);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process Slimpay webhook ${eventId}: ${msg}`);
      saved.markFailed(msg);
      await this.inboxRepo.save(saved);
      return { inboxId: saved.id, status: WebhookEventStatus.FAILED, message: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Signature verification
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
  // Event processing & status mapping
  // -----------------------------------------------------------------------

  private async processEvent(
    companyId: string,
    payload: SlimpayWebhookPayload,
    inbox: PSPEventInboxEntity,
  ): Promise<WebhookProcessingResult> {
    const resource = payload.resource;
    if (!resource) {
      return { inboxId: inbox.id, status: WebhookEventStatus.PROCESSED, message: 'No resource in payload' };
    }

    const rawStatus = resource.executionStatus ?? '';
    const rawReason = resource.rejectReasonCode ?? null;

    // Lookup status mapping via ProviderStatusMappingEntity
    const internalStatus = await this.resolveInternalStatus(rawStatus, rawReason);

    // Create PaymentEvent for the status change
    const event = new PaymentEventEntity();
    event.societeId = companyId;
    event.provider = PaymentProvider.SLIMPAY;
    event.eventType = this.toPaymentEventType(rawStatus);
    event.providerEventId = payload.id;
    event.payload = {
      rawStatus,
      rawReason,
      internalStatus,
      resourceType: resource.type,
      resourceReference: resource.reference ?? resource.id,
    };
    event.processed = true;

    await this.paymentEventRepo.save(event);

    return {
      inboxId: inbox.id,
      status: WebhookEventStatus.PROCESSED,
      internalStatus,
      message: `Mapped ${rawStatus}${rawReason ? `/${rawReason}` : ''} → ${internalStatus}`,
    };
  }

  private async resolveInternalStatus(
    rawStatus: string,
    rawReason: string | null,
  ): Promise<string> {
    // Try exact match with reason first
    if (rawReason) {
      const withReason = await this.statusMappingRepo.findOne({
        where: {
          providerId: 'slimpay',
          providerRawStatus: rawStatus,
          providerRawReason: rawReason,
        },
      });
      if (withReason) {
        return withReason.statusCode;
      }
    }

    // Try match without reason
    const mapping = await this.statusMappingRepo.findOne({
      where: {
        providerId: 'slimpay',
        providerRawStatus: rawStatus,
      },
    });

    if (mapping) {
      return mapping.statusCode;
    }

    // Fallback mapping (Annexe K.2)
    return this.fallbackStatusMapping(rawStatus, rawReason);
  }

  private fallbackStatusMapping(rawStatus: string, rawReason: string | null): string {
    const status = rawStatus.toLowerCase();

    switch (status) {
      case 'created':
        return 'PENDING';
      case 'accepted':
        return 'SUBMITTED';
      case 'executed':
        return 'PAID';
      case 'rejected':
        return rawReason === 'AM04' ? 'REJECT_INSUFF_FUNDS' : 'REJECT_OTHER';
      case 'cancelled':
        return 'CANCELLED';
      case 'refunded':
        return 'REFUNDED';
      case 'error':
        return 'API_ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  private toPaymentEventType(rawStatus: string): PaymentEventType {
    const status = rawStatus.toLowerCase();

    switch (status) {
      case 'created':
        return PaymentEventType.PAYMENT_CREATED;
      case 'accepted':
      case 'executed':
        return PaymentEventType.PAYMENT_SUCCEEDED;
      case 'rejected':
        return PaymentEventType.PAYMENT_FAILED;
      case 'cancelled':
        return PaymentEventType.PAYMENT_CANCELLED;
      case 'refunded':
        return PaymentEventType.REFUND_SUCCEEDED;
      default:
        return PaymentEventType.WEBHOOK_RECEIVED;
    }
  }
}

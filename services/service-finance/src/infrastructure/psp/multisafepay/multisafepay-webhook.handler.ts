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
  MultiSafepayAccountEntity,
} from '../../../domain/payments/entities/multisafepay-account.entity';
import { EncryptionService } from '../../security';

// ─── Status Mapping (Annexe K.3) ────────────────────────────

export interface MSPWebhookStatusMapping {
  internalStatus: string;
  retryAdvice: string;
}

const MSP_STATUS_MAP: Record<string, MSPWebhookStatusMapping> = {
  initialized: { internalStatus: 'PENDING', retryAdvice: 'AUTO' },
  uncleared: { internalStatus: 'SUBMITTED', retryAdvice: 'AUTO' },
  completed: { internalStatus: 'PAID', retryAdvice: 'NONE' },
  declined: { internalStatus: 'REJECT_OTHER', retryAdvice: 'MANUAL' },
  expired: { internalStatus: 'CANCELLED', retryAdvice: 'MANUAL' },
  chargeback: { internalStatus: 'REJECT_INSUFF_FUNDS', retryAdvice: 'AUTO' },
  cancelled: { internalStatus: 'CANCELLED', retryAdvice: 'NONE' },
  refunded: { internalStatus: 'REFUNDED', retryAdvice: 'NONE' },
  error: { internalStatus: 'API_ERROR', retryAdvice: 'MANUAL' },
};

export interface MSPWebhookPayload {
  transactionid?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface MSPWebhookResult {
  success: boolean;
  eventId?: string;
  internalStatus?: string;
  duplicate?: boolean;
  error?: string;
}

// ─── Handler ─────────────────────────────────────────────────

@Injectable()
export class MultiSafepayWebhookHandler {
  private readonly logger = new Logger(MultiSafepayWebhookHandler.name);

  constructor(
    @InjectRepository(PSPEventInboxEntity)
    private readonly inboxRepo: Repository<PSPEventInboxEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    @InjectRepository(MultiSafepayAccountEntity)
    private readonly mspAccountRepo: Repository<MultiSafepayAccountEntity>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Handle incoming MultiSafepay webhook notification.
   * POST /api/payments/webhooks/multisafepay/:companyId
   *
   * Performs:
   * 1. HMAC signature verification
   * 2. Idempotence check via PSPEventInbox
   * 3. Status mapping (Annexe K.3)
   * 4. Event logging
   */
  async handleWebhook(
    companyId: string,
    payload: MSPWebhookPayload,
    signature: string | undefined,
    rawBody: string,
  ): Promise<MSPWebhookResult> {
    const transactionId = payload.transactionid ?? '';

    if (!transactionId) {
      this.logger.warn('Webhook received without transactionid');
      return { success: false, error: 'Missing transactionid' };
    }

    // ─── 1. Verify HMAC ────────────────────────────────────
    const account = await this.mspAccountRepo.findOne({
      where: { societeId: companyId, actif: true },
    });

    if (!account) {
      this.logger.warn(`No active MSP account for company ${companyId}`);
      return { success: false, error: 'Unknown company' };
    }

    if (account.hasWebhookSecret() && signature) {
      const isValid = this.verifyHmac(
        rawBody,
        signature,
        account.webhookSecret,
      );

      if (!isValid) {
        this.logger.warn(
          `HMAC verification failed for transaction ${transactionId}`,
        );

        await this.saveInboxEvent(
          transactionId,
          rawBody,
          signature,
          WebhookEventStatus.REJECTED,
          'HMAC verification failed',
        );

        return { success: false, error: 'Invalid signature' };
      }
    }

    // ─── 2. Idempotence Check ──────────────────────────────
    const existing = await this.inboxRepo.findOne({
      where: {
        pspProvider: PSPProvider.MULTISAFEPAY,
        pspEventId: transactionId,
      },
    });

    if (existing?.isProcessed()) {
      this.logger.debug(`Duplicate webhook for transaction ${transactionId}`);
      existing.markDuplicate();
      await this.inboxRepo.save(existing);
      return {
        success: true,
        eventId: existing.id,
        duplicate: true,
      };
    }

    // ─── 3. Save inbox event ───────────────────────────────
    const inboxEvent = await this.saveInboxEvent(
      transactionId,
      rawBody,
      signature,
      WebhookEventStatus.VERIFIED,
    );

    // ─── 4. Map status ─────────────────────────────────────
    const rawStatus = (
      payload.status ?? ''
    ).toLowerCase();
    const mapping = MSP_STATUS_MAP[rawStatus];
    const internalStatus = mapping?.internalStatus ?? 'UNKNOWN';

    // ─── 5. Log payment event ──────────────────────────────
    const eventType = this.toPaymentEventType(internalStatus);

    await this.logEvent(companyId, eventType, transactionId, {
      rawStatus,
      internalStatus,
      retryAdvice: mapping?.retryAdvice ?? 'MANUAL',
      transactionId,
      payload,
    });

    // ─── 6. Mark processed ─────────────────────────────────
    inboxEvent.markProcessed();
    await this.inboxRepo.save(inboxEvent);

    this.logger.log(
      `Webhook processed: transaction=${transactionId} status=${rawStatus} → ${internalStatus}`,
    );

    return {
      success: true,
      eventId: inboxEvent.id,
      internalStatus,
      duplicate: false,
    };
  }

  /**
   * Map MSP raw status to internal status string.
   */
  mapStatus(rawStatus: string): MSPWebhookStatusMapping | undefined {
    return MSP_STATUS_MAP[rawStatus.toLowerCase()];
  }

  // ─── Private Helpers ─────────────────────────────────────

  private verifyHmac(
    rawBody: string,
    signature: string,
    webhookSecret: string,
  ): boolean {
    try {
      let secret = webhookSecret;
      if (this.encryptionService.isEncrypted(webhookSecret)) {
        secret = this.encryptionService.decrypt(webhookSecret);
      }

      const expected = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      );
    } catch (error) {
      this.logger.error(`HMAC verification error: ${error}`);
      return false;
    }
  }

  private async saveInboxEvent(
    transactionId: string,
    rawPayload: string,
    signature: string | undefined,
    status: WebhookEventStatus,
    errorMessage?: string,
  ): Promise<PSPEventInboxEntity> {
    const event = this.inboxRepo.create({
      pspProvider: PSPProvider.MULTISAFEPAY,
      pspEventId: transactionId,
      pspEventType: 'notification',
      rawPayload,
      signature: signature ?? null,
      status,
      errorMessage: errorMessage ?? null,
    });

    if (status === WebhookEventStatus.VERIFIED) {
      event.markVerified();
    }

    return this.inboxRepo.save(event);
  }

  private toPaymentEventType(internalStatus: string): PaymentEventType {
    switch (internalStatus) {
      case 'PAID':
        return PaymentEventType.PAYMENT_SUCCEEDED;
      case 'REJECT_OTHER':
      case 'REJECT_INSUFF_FUNDS':
      case 'API_ERROR':
        return PaymentEventType.PAYMENT_FAILED;
      case 'CANCELLED':
        return PaymentEventType.PAYMENT_CANCELLED;
      case 'REFUNDED':
        return PaymentEventType.REFUND_SUCCEEDED;
      case 'PENDING':
      case 'SUBMITTED':
        return PaymentEventType.PAYMENT_PROCESSING;
      default:
        return PaymentEventType.WEBHOOK_RECEIVED;
    }
  }

  private async logEvent(
    societeId: string,
    eventType: PaymentEventType,
    providerEventId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const event = this.paymentEventRepo.create({
        societeId,
        provider: PaymentProvider.MULTISAFEPAY,
        eventType,
        providerEventId,
        payload,
        processed: true,
      });
      await this.paymentEventRepo.save(event);
    } catch (error) {
      this.logger.warn(`Failed to log payment event: ${error}`);
    }
  }
}

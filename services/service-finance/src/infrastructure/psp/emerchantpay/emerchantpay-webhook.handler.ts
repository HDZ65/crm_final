import { Controller, Post, Param, Req, Res, Logger, HttpCode } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import { PSPEventInboxEntity, WebhookEventStatus } from '../../../domain/payments/entities/psp-event-inbox.entity';
import { PSPProvider } from '../../../domain/payments/entities/portal-session.entity';
import { EmerchantpayAccountEntity } from '../../../domain/payments/entities/emerchantpay-account.entity';

// ==================== Status Mapping (Annexe K.4) ====================

export enum EMPInternalStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  PAID = 'PAID',
  REJECT_INSUFF_FUNDS = 'REJECT_INSUFF_FUNDS',
  REJECT_OTHER = 'REJECT_OTHER',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  API_ERROR = 'API_ERROR',
}

export interface EMPStatusMapping {
  internalStatus: EMPInternalStatus;
  retryAdvice: 'AUTO' | 'MANUAL' | 'NONE';
}

/**
 * Maps Emerchantpay raw status + reason code to internal status.
 * Based on Annexe K.4 of EXTRACTED_PAIEMENTS.txt
 */
export function mapEmpStatus(empStatus: string, reasonCode?: string): EMPStatusMapping {
  const normalized = (empStatus || '').toLowerCase();

  switch (normalized) {
    case 'pending':
      return { internalStatus: EMPInternalStatus.PENDING, retryAdvice: 'AUTO' };

    case 'submitted':
    case 'approved':
      return { internalStatus: EMPInternalStatus.SUBMITTED, retryAdvice: 'AUTO' };

    case 'settled':
      return { internalStatus: EMPInternalStatus.PAID, retryAdvice: 'NONE' };

    case 'returned':
      if (reasonCode === 'AM04') {
        return { internalStatus: EMPInternalStatus.REJECT_INSUFF_FUNDS, retryAdvice: 'AUTO' };
      }
      return { internalStatus: EMPInternalStatus.REJECT_OTHER, retryAdvice: 'MANUAL' };

    case 'declined':
      return { internalStatus: EMPInternalStatus.REJECT_OTHER, retryAdvice: 'MANUAL' };

    case 'cancelled':
    case 'voided':
      return { internalStatus: EMPInternalStatus.CANCELLED, retryAdvice: 'NONE' };

    case 'refunded':
      return { internalStatus: EMPInternalStatus.REFUNDED, retryAdvice: 'NONE' };

    case 'error':
      return { internalStatus: EMPInternalStatus.API_ERROR, retryAdvice: 'MANUAL' };

    default:
      return { internalStatus: EMPInternalStatus.REJECT_OTHER, retryAdvice: 'MANUAL' };
  }
}

// ==================== Webhook Handler ====================

@Controller('api/payments/webhooks')
export class EmerchantpayWebhookHandler {
  private readonly logger = new Logger(EmerchantpayWebhookHandler.name);

  constructor(
    @InjectRepository(PSPEventInboxEntity)
    private readonly inboxRepo: Repository<PSPEventInboxEntity>,
    @InjectRepository(EmerchantpayAccountEntity)
    private readonly accountRepo: Repository<EmerchantpayAccountEntity>,
  ) {}

  @Post('emerchantpay/:companyId')
  @HttpCode(200)
  async handleWebhook(
    @Param('companyId') companyId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const rawBody = await this.getRawBody(req);
    const signature = (req.headers['x-emp-signature'] as string) || '';

    this.logger.log(`Received EMP webhook for company ${companyId}`);

    // 1. Parse payload
    let payload: EMPWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      this.logger.error('Failed to parse webhook payload');
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    const eventId = payload.unique_id || payload.transaction_unique_id || '';
    if (!eventId) {
      this.logger.error('Webhook missing unique_id');
      res.status(400).json({ error: 'Missing unique_id' });
      return;
    }

    // 2. Idempotence check via PSPEventInbox
    const existing = await this.inboxRepo.findOne({
      where: {
        pspProvider: PSPProvider.EMERCHANTPAY,
        pspEventId: eventId,
      },
    });

    if (existing) {
      this.logger.log(`Duplicate webhook event: ${eventId}`);
      existing.markDuplicate();
      await this.inboxRepo.save(existing);
      res.status(200).json({ status: 'duplicate' });
      return;
    }

    // 3. Create inbox entry
    const inboxEntry = this.inboxRepo.create({
      pspProvider: PSPProvider.EMERCHANTPAY,
      pspEventId: eventId,
      pspEventType: payload.transaction_type || null,
      rawPayload: rawBody,
      signature: signature || null,
      status: WebhookEventStatus.RECEIVED,
    });
    await this.inboxRepo.save(inboxEntry);

    // 4. HMAC signature verification
    const account = await this.accountRepo.findOne({
      where: { societeId: companyId, actif: true },
    });

    if (!account || !account.hasWebhookKey()) {
      this.logger.warn(`No active EMP account or webhook key for societe ${companyId}`);
      inboxEntry.markRejected('No active account or missing webhook public key');
      await this.inboxRepo.save(inboxEntry);
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (signature && !this.verifySignature(rawBody, signature, account.webhookPublicKey!)) {
      this.logger.warn(`HMAC verification failed for event ${eventId}`);
      inboxEntry.markRejected('HMAC signature verification failed');
      await this.inboxRepo.save(inboxEntry);
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    inboxEntry.markVerified();

    // 5. Map status
    const statusMapping = mapEmpStatus(
      payload.status || '',
      payload.reason_code,
    );

    this.logger.log(
      `EMP event ${eventId}: ${payload.status} → ${statusMapping.internalStatus} (retry: ${statusMapping.retryAdvice})`,
    );

    // 6. Mark processed
    try {
      inboxEntry.markProcessed();
      await this.inboxRepo.save(inboxEntry);
      res.status(200).json({
        status: 'processed',
        internalStatus: statusMapping.internalStatus,
        retryAdvice: statusMapping.retryAdvice,
      });
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${(error as Error).message}`);
      inboxEntry.markFailed((error as Error).message);
      await this.inboxRepo.save(inboxEntry);
      res.status(500).json({ error: 'Processing failed' });
    }
  }

  // ==================== Helpers ====================

  private verifySignature(
    rawBody: string,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const hmac = crypto
        .createHmac('sha256', publicKey)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(hmac, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch (error) {
      this.logger.error(`Signature verification error: ${(error as Error).message}`);
      return false;
    }
  }

  private async getRawBody(req: Request): Promise<string> {
    // If body is already parsed as string/buffer (via raw body middleware)
    if (typeof req.body === 'string') {
      return req.body;
    }
    if (Buffer.isBuffer(req.body)) {
      return req.body.toString('utf-8');
    }
    // Fallback: re-serialize (loses original formatting but works)
    return JSON.stringify(req.body);
  }
}

// ==================== Webhook payload shape ====================

interface EMPWebhookPayload {
  unique_id?: string;
  transaction_unique_id?: string;
  transaction_id?: string;
  transaction_type?: string;
  status?: string;
  amount?: number;
  currency?: string;
  reason_code?: string;
  message?: string;
  technical_message?: string;
  [key: string]: unknown;
}

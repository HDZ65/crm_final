import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

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
  StripeAccountEntity,
} from '../../../domain/payments/entities/stripe-account.entity';
import { PaymentProvider } from '../../../domain/payments/entities/schedule.entity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookProcessingResult {
  inboxId: string;
  status: WebhookEventStatus;
  internalStatus?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Stripe event type → internal status mapping (max 6 types)
// ---------------------------------------------------------------------------

const STRIPE_EVENT_MAP: Record<string, { eventType: PaymentEventType; internalStatus: string }> = {
  'payment_intent.succeeded': {
    eventType: PaymentEventType.PAYMENT_SUCCEEDED,
    internalStatus: 'PAID',
  },
  'payment_intent.payment_failed': {
    eventType: PaymentEventType.PAYMENT_FAILED,
    internalStatus: 'REJECT_OTHER',
  },
  'charge.refunded': {
    eventType: PaymentEventType.REFUND_SUCCEEDED,
    internalStatus: 'REFUNDED',
  },
  'charge.dispute.created': {
    eventType: PaymentEventType.WEBHOOK_RECEIVED,
    internalStatus: 'DISPUTE_CREATED',
  },
  'customer.subscription.deleted': {
    eventType: PaymentEventType.PAYMENT_CANCELLED,
    internalStatus: 'SUBSCRIPTION_CANCELLED',
  },
  'customer.subscription.updated': {
    eventType: PaymentEventType.WEBHOOK_RECEIVED,
    internalStatus: 'SUBSCRIPTION_UPDATED',
  },
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(
    @InjectRepository(PSPEventInboxEntity)
    private readonly inboxRepo: Repository<PSPEventInboxEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    @InjectRepository(ProviderStatusMappingEntity)
    private readonly statusMappingRepo: Repository<ProviderStatusMappingEntity>,
    @InjectRepository(StripeAccountEntity)
    private readonly stripeAccountRepo: Repository<StripeAccountEntity>,
  ) {}

  // -----------------------------------------------------------------------
  // Main entry point
  // -----------------------------------------------------------------------

  async handleWebhook(
    companyId: string,
    rawBody: string | Buffer,
    signatureHeader: string | undefined,
  ): Promise<WebhookProcessingResult> {
    // 1. Retrieve account and webhook secret
    const account = await this.stripeAccountRepo.findOne({
      where: { societeId: companyId, actif: true },
    });

    if (!account) {
      this.logger.warn(`No active Stripe account for company ${companyId}`);
      return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Unknown company' };
    }

    if (!account.hasWebhookSecret()) {
      this.logger.warn(`No webhook secret configured for Stripe account ${account.id}`);
      return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'No webhook secret configured' };
    }

    // 2. Verify signature using Stripe SDK
    let event: Stripe.Event;
    try {
      const stripe = new Stripe(account.stripeSecretKey, {
        apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      });
      event = stripe.webhooks.constructEvent(
        rawBody,
        signatureHeader ?? '',
        account.stripeWebhookSecret,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Invalid Stripe webhook signature for company ${companyId}: ${msg}`);
      return { inboxId: '', status: WebhookEventStatus.REJECTED, message: 'Invalid signature' };
    }

    const eventId = event.id;

    // 3. Idempotence: check PSPEventInbox
    const existing = await this.inboxRepo.findOne({
      where: { pspProvider: PSPProvider.STRIPE, pspEventId: eventId },
    });

    if (existing) {
      this.logger.log(`Duplicate Stripe webhook ${eventId}, skipping`);
      existing.markDuplicate();
      await this.inboxRepo.save(existing);
      return { inboxId: existing.id, status: WebhookEventStatus.DUPLICATE, message: 'Duplicate event' };
    }

    // 4. Store in inbox
    const inbox = new PSPEventInboxEntity();
    inbox.pspProvider = PSPProvider.STRIPE;
    inbox.pspEventId = eventId;
    inbox.pspEventType = event.type;
    inbox.rawPayload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    inbox.signature = signatureHeader ?? null;
    inbox.status = WebhookEventStatus.RECEIVED;
    inbox.receivedAt = new Date();

    inbox.markVerified();
    const saved = await this.inboxRepo.save(inbox);

    // 5. Process event
    try {
      const result = await this.processEvent(companyId, event, saved);
      saved.markProcessed();
      await this.inboxRepo.save(saved);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process Stripe webhook ${eventId}: ${msg}`);
      saved.markFailed(msg);
      await this.inboxRepo.save(saved);
      return { inboxId: saved.id, status: WebhookEventStatus.FAILED, message: msg };
    }
  }

  // -----------------------------------------------------------------------
  // Event processing & status mapping
  // -----------------------------------------------------------------------

  private async processEvent(
    companyId: string,
    stripeEvent: Stripe.Event,
    inbox: PSPEventInboxEntity,
  ): Promise<WebhookProcessingResult> {
    const mapping = STRIPE_EVENT_MAP[stripeEvent.type];

    if (!mapping) {
      this.logger.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
      return {
        inboxId: inbox.id,
        status: WebhookEventStatus.PROCESSED,
        message: `Unhandled event type: ${stripeEvent.type}`,
      };
    }

    // Resolve internal status via ProviderStatusMapping if available
    const internalStatus = await this.resolveInternalStatus(
      stripeEvent.type,
      mapping.internalStatus,
    );

    // Log specific alerts for important events
    if (stripeEvent.type === 'charge.dispute.created') {
      this.logger.warn(
        `[ALERT] Stripe dispute created for company ${companyId}, event ${stripeEvent.id}`,
      );
    }
    if (stripeEvent.type === 'customer.subscription.deleted') {
      this.logger.log(
        `Stripe subscription deleted for company ${companyId}, event ${stripeEvent.id}`,
      );
    }
    if (stripeEvent.type === 'customer.subscription.updated') {
      this.logger.log(
        `Stripe subscription updated for company ${companyId}, event ${stripeEvent.id}`,
      );
    }

    // Create PaymentEvent for the status change
    const paymentEvent = new PaymentEventEntity();
    paymentEvent.societeId = companyId;
    paymentEvent.provider = PaymentProvider.STRIPE;
    paymentEvent.eventType = mapping.eventType;
    paymentEvent.providerEventId = stripeEvent.id;
    paymentEvent.payload = {
      stripeEventType: stripeEvent.type,
      internalStatus,
      data: stripeEvent.data?.object ?? {},
    };
    paymentEvent.processed = true;

    await this.paymentEventRepo.save(paymentEvent);

    return {
      inboxId: inbox.id,
      status: WebhookEventStatus.PROCESSED,
      internalStatus,
      message: `Mapped ${stripeEvent.type} → ${internalStatus}`,
    };
  }

  private async resolveInternalStatus(
    stripeEventType: string,
    fallbackStatus: string,
  ): Promise<string> {
    // Try to find a mapping in ProviderStatusMapping table
    const mapping = await this.statusMappingRepo.findOne({
      where: {
        providerId: 'stripe',
        providerRawStatus: stripeEventType,
      },
    });

    if (mapping) {
      return mapping.statusCode;
    }

    return fallbackStatus;
  }
}

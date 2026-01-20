import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash, createHmac } from 'crypto';
import {
  PortalPaymentSessionEntity,
  PortalSessionStatus,
  PortalSessionAction,
  PSPProvider,
} from './entities/portal-session.entity.js';
import { PSPEventInboxEntity, WebhookEventStatus } from './entities/psp-event-inbox.entity.js';
import { PortalSessionAuditEntity, AuditEventType, AuditActorType } from './entities/portal-session-audit.entity.js';
import { PortalSessionService, RequestContext } from './portal-session.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { GoCardlessService } from '../gocardless/gocardless.service.js';
import { SlimpayService } from '../slimpay/slimpay.service.js';
import { MultiSafepayService } from '../multisafepay/multisafepay.service.js';
import { EmerchantpayService } from '../emerchantpay/emerchantpay.service.js';

export interface StartRedirectParams {
  token: string;
  paymentMethod: 'CARD' | 'SEPA_DEBIT' | 'SEPA_SETUP';
  successUrl: string;
  cancelUrl: string;
  requestContext?: RequestContext;
}

export interface StartRedirectResult {
  redirectUrl: string;
  pspSessionId: string;
  session: PortalPaymentSessionEntity;
}

export interface HandleReturnParams {
  state: string;
  pspParams: Record<string, string>;
  requestContext?: RequestContext;
}

export interface HandleReturnResult {
  session: PortalPaymentSessionEntity;
  paymentConfirmed: boolean;
  pendingConfirmation: boolean;
  message: string;
}

export interface HandleWebhookParams {
  provider: PSPProvider;
  rawBody: string;
  signature: string;
  headers: Record<string, string>;
}

export interface HandleWebhookResult {
  acknowledged: boolean;
  eventId: string;
  status: WebhookEventStatus;
}

const PSP_STATE_BYTES = 32;

@Injectable()
export class PortalPSPService {
  private readonly logger = new Logger(PortalPSPService.name);

  constructor(
    @InjectRepository(PortalPaymentSessionEntity)
    private readonly sessionRepository: Repository<PortalPaymentSessionEntity>,
    @InjectRepository(PSPEventInboxEntity)
    private readonly eventInboxRepository: Repository<PSPEventInboxEntity>,
    @InjectRepository(PortalSessionAuditEntity)
    private readonly auditRepository: Repository<PortalSessionAuditEntity>,
    private readonly portalSessionService: PortalSessionService,
    private readonly stripeService: StripeService,
    private readonly goCardlessService: GoCardlessService,
    private readonly slimpayService: SlimpayService,
    private readonly multisafepayService: MultiSafepayService,
    private readonly emerchantpayService: EmerchantpayService,
  ) {}

  async startRedirect(params: StartRedirectParams): Promise<StartRedirectResult> {
    const actionMap: Record<string, PortalSessionAction> = {
      CARD: PortalSessionAction.PAY_BY_CARD,
      SEPA_DEBIT: PortalSessionAction.PAY_BY_SEPA,
      SEPA_SETUP: PortalSessionAction.SETUP_SEPA,
    };

    const action = actionMap[params.paymentMethod];
    if (!action) {
      throw new BadRequestException(`Invalid payment method: ${params.paymentMethod}`);
    }

    const session = await this.portalSessionService.consumeToken(
      params.token,
      action,
      params.requestContext,
    );

    this.validateRedirectUrls(params.successUrl, params.cancelUrl);

    const pspState = this.generatePspState();

    let redirectUrl: string;
    let pspSessionId: string;
    let pspProvider: PSPProvider;

    switch (params.paymentMethod) {
      case 'CARD':
        const stripeResult = await this.createStripeCheckout(session, params, pspState);
        redirectUrl = stripeResult.redirectUrl;
        pspSessionId = stripeResult.sessionId;
        pspProvider = PSPProvider.STRIPE;
        break;

      case 'SEPA_DEBIT':
        const sepaResult = await this.createSepaPayment(session);
        redirectUrl = sepaResult.redirectUrl;
        pspSessionId = sepaResult.paymentId;
        pspProvider = PSPProvider.GOCARDLESS;
        break;

      case 'SEPA_SETUP':
        const mandateResult = await this.createSepaMandate(session, params, pspState);
        redirectUrl = mandateResult.redirectUrl;
        pspSessionId = mandateResult.billingRequestId;
        pspProvider = PSPProvider.GOCARDLESS;
        break;

      default:
        throw new BadRequestException(`Unsupported payment method: ${params.paymentMethod}`);
    }

    await this.portalSessionService.updatePSPInfo(session, {
      pspState,
      pspRedirectUrl: redirectUrl,
      pspProvider: pspProvider,
      pspSessionId,
    });

    await this.portalSessionService.transitionStatus(
      session,
      PortalSessionStatus.REDIRECTED,
      AuditActorType.PORTAL_TOKEN,
      params.requestContext,
      {
        paymentMethod: params.paymentMethod,
        pspProvider,
        pspSessionId,
      },
    );

    this.logger.log(`Redirect started for session ${session.id} to ${pspProvider}`);

    return {
      redirectUrl,
      pspSessionId,
      session,
    };
  }

  async handleReturn(params: HandleReturnParams): Promise<HandleReturnResult> {
    const session = await this.portalSessionService.findByPspState(params.state);

    if (!session) {
      this.logger.warn(`No session found for state: ${params.state.substring(0, 8)}...`);
      throw new BadRequestException('Invalid or expired state');
    }

    await this.createAuditEntry({
      portalSessionId: session.id,
      eventType: AuditEventType.CALLBACK_RECEIVED,
      actorType: AuditActorType.PORTAL_TOKEN,
      ipAddressHash: params.requestContext?.ipHash,
      userAgentHash: params.requestContext?.uaHash,
      requestId: params.requestContext?.requestId,
      data: { pspParams: JSON.stringify(params.pspParams) },
    });

    if (session.status === PortalSessionStatus.COMPLETED) {
      return {
        session,
        paymentConfirmed: true,
        pendingConfirmation: false,
        message: 'Paiement confirmé',
      };
    }

    if (session.status === PortalSessionStatus.FAILED) {
      return {
        session,
        paymentConfirmed: false,
        pendingConfirmation: false,
        message: 'Le paiement a échoué',
      };
    }

    return {
      session,
      paymentConfirmed: false,
      pendingConfirmation: true,
      message: 'Paiement en cours de traitement...',
    };
  }

  async handleWebhook(params: HandleWebhookParams): Promise<HandleWebhookResult> {
    let eventId: string;
    let eventType: string;
    let payload: any;

    try {
      const parsed = JSON.parse(params.rawBody);
      eventId = this.extractEventId(params.provider, parsed);
      eventType = this.extractEventType(params.provider, parsed);
      payload = parsed;
    } catch (error) {
      this.logger.error(`Failed to parse webhook payload: ${error}`);
      throw new BadRequestException('Invalid webhook payload');
    }

    const existingEvent = await this.eventInboxRepository.findOne({
      where: { pspProvider: params.provider, pspEventId: eventId },
    });

    if (existingEvent) {
      this.logger.log(`Duplicate webhook detected: ${params.provider}/${eventId}`);
      return {
        acknowledged: true,
        eventId: existingEvent.id,
        status: WebhookEventStatus.DUPLICATE,
      };
    }

    const event = this.eventInboxRepository.create({
      pspProvider: params.provider,
      pspEventId: eventId,
      pspEventType: eventType,
      rawPayload: params.rawBody,
      signature: params.signature,
      status: WebhookEventStatus.RECEIVED,
    });

    const savedEvent = await this.eventInboxRepository.save(event);

    try {
      await this.verifyWebhookSignature(params);
      savedEvent.markVerified();
      await this.eventInboxRepository.save(savedEvent);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error}`);
      savedEvent.markRejected(`Signature verification failed: ${error}`);
      await this.eventInboxRepository.save(savedEvent);
      return {
        acknowledged: false,
        eventId: savedEvent.id,
        status: WebhookEventStatus.REJECTED,
      };
    }

    try {
      await this.processWebhookEvent(savedEvent, payload);
      savedEvent.markProcessed();
      await this.eventInboxRepository.save(savedEvent);
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error}`);
      savedEvent.markFailed(`Processing failed: ${error}`);
      await this.eventInboxRepository.save(savedEvent);
      return {
        acknowledged: true,
        eventId: savedEvent.id,
        status: WebhookEventStatus.FAILED,
      };
    }

    return {
      acknowledged: true,
      eventId: savedEvent.id,
      status: WebhookEventStatus.PROCESSED,
    };
  }

  private async createStripeCheckout(
    session: PortalPaymentSessionEntity,
    params: StartRedirectParams,
    pspState: string,
  ): Promise<{ redirectUrl: string; sessionId: string }> {
    const successUrlWithState = this.appendStateToUrl(params.successUrl, pspState);
    const cancelUrlWithState = this.appendStateToUrl(params.cancelUrl, pspState);

    const result = await this.stripeService.createCheckoutSession(session.societeId, {
      amount: session.amountCents / 100,
      currency: session.currency.toLowerCase(),
      successUrl: successUrlWithState,
      cancelUrl: cancelUrlWithState,
      clientReferenceId: session.id,
      metadata: {
        portalSessionId: session.id,
        customerId: session.customerId,
        contractId: session.contractId ?? '',
      },
    });

    return {
      redirectUrl: result.sessionUrl,
      sessionId: result.sessionId,
    };
  }

  private async createSepaPayment(
    session: PortalPaymentSessionEntity,
  ): Promise<{ redirectUrl: string; paymentId: string }> {
    if (!session.mandateId) {
      throw new BadRequestException('No mandate available for SEPA payment');
    }

    const mandate = await this.goCardlessService.getActiveMandate(
      session.societeId,
      session.customerId,
    );

    if (!mandate) {
      throw new BadRequestException('No active mandate found');
    }

    const result = await this.goCardlessService.createPayment(session.societeId, {
      mandateId: mandate.id,
      amount: session.amountCents / 100,
      currency: session.currency,
      description: session.description ?? undefined,
      metadata: {
        portalSessionId: session.id,
      },
    });

    return {
      redirectUrl: '',
      paymentId: result.paymentId,
    };
  }

  private async createSepaMandate(
    session: PortalPaymentSessionEntity,
    params: StartRedirectParams,
    pspState: string,
  ): Promise<{ redirectUrl: string; billingRequestId: string }> {
    const redirectUri = this.appendStateToUrl(params.successUrl, pspState);

    const result = await this.goCardlessService.createBillingRequest(session.societeId, {
      clientId: session.customerId,
      description: session.description ?? undefined,
      redirectUri,
    });

    return {
      redirectUrl: result.authorisationUrl,
      billingRequestId: result.billingRequestId,
    };
  }

  private async verifyWebhookSignature(params: HandleWebhookParams): Promise<void> {
    switch (params.provider) {
      case PSPProvider.STRIPE:
        return;

      case PSPProvider.GOCARDLESS:
        return;

      case PSPProvider.PAYPAL:
        return;

      case PSPProvider.SLIMPAY: {
        const account = await this.slimpayService.getAccountBySocieteId(this.resolveSocieteId(params));
        if (!account || !account.webhookSecret) {
          throw new BadRequestException('Slimpay webhook secret not configured');
        }

        const signature = params.headers['slimpay-signature'] || params.signature;
        const valid = this.slimpayService.verifyWebhookSignature({
          rawBody: params.rawBody,
          signature,
          secret: account.webhookSecret,
          maxAgeSeconds: 300,
        });

        if (!valid) {
          throw new BadRequestException('Invalid Slimpay webhook signature');
        }
        return;
      }

      case PSPProvider.MULTISAFEPAY: {
        const account = await this.multisafepayService.getAccountBySocieteId(this.resolveSocieteId(params));
        if (!account || !account.apiKey) {
          throw new BadRequestException('MultiSafepay API key not configured');
        }

        const authHeader = params.headers['auth'] || params.headers['Auth'] || params.signature;
        const valid = this.multisafepayService.verifyWebhookSignature({
          rawBody: params.rawBody,
          authHeader,
          apiKey: account.apiKey,
        });

        if (!valid) {
          throw new BadRequestException('Invalid MultiSafepay webhook signature');
        }
        return;
      }

      case PSPProvider.EMERCHANTPAY: {
        const account = await this.emerchantpayService.getAccountBySocieteId(this.resolveSocieteId(params));
        if (!account || !account.webhookPublicKey) {
          throw new BadRequestException('Emerchantpay webhook key not configured');
        }

        const signature = params.headers['content-signature'] || params.headers['Content-Signature'] || params.signature;
        const valid = this.emerchantpayService.verifyWebhookSignature({
          rawBody: params.rawBody,
          signature,
          publicKey: account.webhookPublicKey,
        });

        if (!valid) {
          throw new BadRequestException('Invalid Emerchantpay webhook signature');
        }
        return;
      }

      default:
        this.logger.warn(`No signature verification for provider: ${params.provider}`);
    }
  }

  private async processWebhookEvent(event: PSPEventInboxEntity, payload: any): Promise<void> {
    let sessionId: string | null = null;
    let newStatus: PortalSessionStatus | null = null;

    switch (event.pspProvider) {
      case PSPProvider.STRIPE:
        sessionId = payload.data?.object?.metadata?.portalSessionId;
        if (payload.type === 'checkout.session.completed') {
          newStatus = PortalSessionStatus.COMPLETED;
        } else if (payload.type === 'payment_intent.payment_failed') {
          newStatus = PortalSessionStatus.FAILED;
        }
        break;

      case PSPProvider.GOCARDLESS:
        sessionId = payload.events?.[0]?.metadata?.portalSessionId;
        const action = payload.events?.[0]?.action;
        if (action === 'confirmed' || action === 'paid_out') {
          newStatus = PortalSessionStatus.COMPLETED;
        } else if (action === 'failed' || action === 'cancelled') {
          newStatus = PortalSessionStatus.FAILED;
        }
        break;
    }

    if (sessionId && newStatus) {
      const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

      if (session && session.canTransitionTo(newStatus)) {
        event.portalSessionId = sessionId;

        await this.portalSessionService.transitionStatus(
          session,
          newStatus,
          AuditActorType.WEBHOOK,
          undefined,
          {
            webhookEventId: event.id,
            pspEventId: event.pspEventId,
            pspEventType: event.pspEventType ?? '',
          },
        );

        this.logger.log(`Webhook processed: session ${sessionId} → ${newStatus}`);
      }
    }
  }

  private extractEventId(provider: PSPProvider, payload: any): string {
    switch (provider) {
      case PSPProvider.STRIPE:
        return payload.id;
      case PSPProvider.GOCARDLESS:
        return payload.events?.[0]?.id ?? payload.id;
      case PSPProvider.PAYPAL:
        return payload.id;
      default:
        return payload.id ?? randomBytes(16).toString('hex');
    }
  }

  private extractEventType(provider: PSPProvider, payload: any): string {
    switch (provider) {
      case PSPProvider.STRIPE:
        return payload.type;
      case PSPProvider.GOCARDLESS:
        return `${payload.events?.[0]?.resource_type}.${payload.events?.[0]?.action}`;
      case PSPProvider.PAYPAL:
        return payload.event_type;
      default:
        return 'unknown';
    }
  }

  private generatePspState(): string {
    return randomBytes(PSP_STATE_BYTES).toString('base64url');
  }

  private appendStateToUrl(url: string, state: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set('state', state);
    return urlObj.toString();
  }

  private validateRedirectUrls(successUrl: string, cancelUrl: string): void {
    const allowedOrigins = (process.env.PORTAL_ALLOWED_REDIRECT_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (allowedOrigins.length === 0) {
      return;
    }

    for (const url of [successUrl, cancelUrl]) {
      const urlObj = new URL(url);
      if (!allowedOrigins.some((origin) => urlObj.origin === origin)) {
        throw new BadRequestException(`Redirect URL origin not allowed: ${urlObj.origin}`);
      }
    }
  }

  private async createAuditEntry(params: {
    portalSessionId: string;
    eventType: AuditEventType;
    actorType: AuditActorType;
    previousStatus?: string;
    newStatus?: string;
    ipAddressHash?: string;
    userAgentHash?: string;
    requestId?: string;
    data?: Record<string, string>;
  }): Promise<void> {
    const audit = this.auditRepository.create({
      portalSessionId: params.portalSessionId,
      eventType: params.eventType,
      actorType: params.actorType,
      previousStatus: params.previousStatus ?? null,
      newStatus: params.newStatus ?? null,
      ipAddressHash: params.ipAddressHash ?? null,
      userAgentHash: params.userAgentHash ?? null,
      requestId: params.requestId ?? null,
      data: params.data ?? {},
    });

    await this.auditRepository.save(audit);
  }
}

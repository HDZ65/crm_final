import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { createHash } from 'crypto';
import { PortalSessionService, RequestContext } from './portal-session.service.js';
import { PortalPSPService } from './portal-psp.service.js';
import { PortalQueryService } from './portal-query.service.js';
import {
  PortalPaymentSessionEntity,
  PortalSessionAction,
  PortalSessionStatus,
  PSPProvider,
} from './entities/portal-session.entity.js';

interface CreatePortalSessionRequest {
  organisationId: string;
  societeId: string;
  customerId: string;
  contractId?: string;
  paymentIntentId?: string;
  allowedActions: string[];
  ttlSeconds?: number;
  maxUses?: number;
  amountCents: number;
  currency?: string;
  description?: string;
  mandateId?: string;
  rumMasked?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

interface CreatePortalSessionResponse {
  session: PortalSessionResponse;
  portalUrl: string;
  token: string;
  wasIdempotentHit: boolean;
}

interface GetPortalSessionRequest {
  token?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface GetPortalSessionResponse {
  session: PortalSessionResponse;
}

interface CancelPortalSessionRequest {
  sessionId: string;
  reason?: string;
}

interface CancelPortalSessionResponse {
  session: PortalSessionResponse;
}

interface StartPSPRedirectRequest {
  token: string;
  paymentMethod: string;
  successUrl: string;
  cancelUrl: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface StartPSPRedirectResponse {
  redirectUrl: string;
  pspSessionId: string;
  session: PortalSessionResponse;
}

interface HandlePSPReturnRequest {
  state: string;
  pspParams: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface HandlePSPReturnResponse {
  session: PortalSessionResponse;
  paymentConfirmed: boolean;
  pendingConfirmation: boolean;
  message: string;
}

interface HandlePSPWebhookRequest {
  provider: string;
  rawBody: string;
  signature: string;
  headers: Record<string, string>;
}

interface HandlePSPWebhookResponse {
  acknowledged: boolean;
  eventId: string;
  status: string;
}

interface ListPortalSessionsRequest {
  organisationId: string;
  customerId?: string;
  contractId?: string;
  status?: string;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

interface ListPortalSessionsResponse {
  sessions: PortalSessionResponse[];
  total: number;
  page: number;
  totalPages: number;
}

interface GetPortalSessionAuditRequest {
  sessionId: string;
  page?: number;
  limit?: number;
}

interface GetPortalSessionAuditResponse {
  events: AuditEventResponse[];
  total: number;
  page: number;
  totalPages: number;
}

interface PortalSessionResponse {
  id: string;
  organisationId: string;
  societeId: string;
  customerId: string;
  contractId?: string;
  paymentIntentId?: string;
  status: string;
  allowedActions: string[];
  expiresAt: string;
  maxUses: number;
  useCount: number;
  amountCents: number;
  currency: string;
  description?: string;
  mandateId?: string;
  rumMasked?: string;
  pspProvider?: string;
  pspSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditEventResponse {
  id: string;
  portalSessionId: string;
  eventType: string;
  actorType: string;
  requestId?: string;
  previousStatus?: string;
  newStatus?: string;
  data: Record<string, string>;
  createdAt: string;
}

@Controller()
export class PortalController {
  private readonly logger = new Logger(PortalController.name);

  constructor(
    private readonly portalSessionService: PortalSessionService,
    private readonly portalPSPService: PortalPSPService,
    private readonly portalQueryService: PortalQueryService,
  ) {}

  @GrpcMethod('PortalSessionService', 'CreateSession')
  async createSession(data: CreatePortalSessionRequest): Promise<CreatePortalSessionResponse> {
    this.logger.log(`CreateSession for customer: ${data.customerId}`);

    const result = await this.portalSessionService.createSession({
      organisationId: data.organisationId,
      societeId: data.societeId,
      customerId: data.customerId,
      contractId: data.contractId,
      paymentIntentId: data.paymentIntentId,
      allowedActions: data.allowedActions.map((a) => a as PortalSessionAction),
      ttlSeconds: data.ttlSeconds,
      maxUses: data.maxUses,
      amountCents: data.amountCents,
      currency: data.currency,
      description: data.description,
      mandateId: data.mandateId,
      rumMasked: data.rumMasked,
      idempotencyKey: data.idempotencyKey,
      metadata: data.metadata ?? {},
    });

    return {
      session: this.mapSessionToResponse(result.session),
      portalUrl: result.portalUrl,
      token: result.token,
      wasIdempotentHit: result.wasIdempotentHit,
    };
  }

  @GrpcMethod('PortalSessionService', 'GetSession')
  async getSession(data: GetPortalSessionRequest): Promise<GetPortalSessionResponse> {
    const requestContext = this.buildRequestContext(data);

    let session: PortalPaymentSessionEntity | null;

    if (data.token) {
      session = await this.portalSessionService.accessSession(data.token, requestContext);
    } else if (data.sessionId) {
      session = await this.portalSessionService.getSessionById(data.sessionId);
    } else {
      throw new Error('Either token or sessionId must be provided');
    }

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      session: this.mapSessionToResponse(session),
    };
  }

  @GrpcMethod('PortalSessionService', 'CancelSession')
  async cancelSession(data: CancelPortalSessionRequest): Promise<CancelPortalSessionResponse> {
    this.logger.log(`CancelSession: ${data.sessionId}`);

    const session = await this.portalSessionService.cancelSession(data.sessionId, data.reason);

    return {
      session: this.mapSessionToResponse(session),
    };
  }

  @GrpcMethod('PortalPSPService', 'StartRedirect')
  async startRedirect(data: StartPSPRedirectRequest): Promise<StartPSPRedirectResponse> {
    this.logger.log(`StartRedirect with payment method: ${data.paymentMethod}`);

    const requestContext = this.buildRequestContext(data);

    const result = await this.portalPSPService.startRedirect({
      token: data.token,
      paymentMethod: data.paymentMethod as 'CARD' | 'SEPA_DEBIT' | 'SEPA_SETUP',
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      requestContext,
    });

    return {
      redirectUrl: result.redirectUrl,
      pspSessionId: result.pspSessionId,
      session: this.mapSessionToResponse(result.session),
    };
  }

  @GrpcMethod('PortalPSPService', 'HandleReturn')
  async handleReturn(data: HandlePSPReturnRequest): Promise<HandlePSPReturnResponse> {
    this.logger.log(`HandleReturn with state: ${data.state.substring(0, 8)}...`);

    const requestContext = this.buildRequestContext(data);

    const result = await this.portalPSPService.handleReturn({
      state: data.state,
      pspParams: data.pspParams,
      requestContext,
    });

    return {
      session: this.mapSessionToResponse(result.session),
      paymentConfirmed: result.paymentConfirmed,
      pendingConfirmation: result.pendingConfirmation,
      message: result.message,
    };
  }

  @GrpcMethod('PortalPSPService', 'HandleWebhook')
  async handleWebhook(data: HandlePSPWebhookRequest): Promise<HandlePSPWebhookResponse> {
    this.logger.log(`HandleWebhook from provider: ${data.provider}`);

    const providerMap: Record<string, PSPProvider> = {
      STRIPE: PSPProvider.STRIPE,
      PAYPAL: PSPProvider.PAYPAL,
      GOCARDLESS: PSPProvider.GOCARDLESS,
    };

    const provider = providerMap[data.provider];
    if (!provider) {
      throw new Error(`Unknown provider: ${data.provider}`);
    }

    const result = await this.portalPSPService.handleWebhook({
      provider,
      rawBody: data.rawBody,
      signature: data.signature,
      headers: data.headers,
    });

    return {
      acknowledged: result.acknowledged,
      eventId: result.eventId,
      status: result.status,
    };
  }

  @GrpcMethod('PortalQueryService', 'ListSessions')
  async listSessions(data: ListPortalSessionsRequest): Promise<ListPortalSessionsResponse> {
    this.logger.log(`ListSessions for organisation: ${data.organisationId}`);

    const result = await this.portalQueryService.listSessions({
      organisationId: data.organisationId,
      customerId: data.customerId,
      contractId: data.contractId,
      status: data.status as PortalSessionStatus,
      createdAfter: data.createdAfter ? new Date(data.createdAfter) : undefined,
      createdBefore: data.createdBefore ? new Date(data.createdBefore) : undefined,
      page: data.page,
      limit: data.limit,
    });

    return {
      sessions: result.sessions.map((s) => this.mapSessionToResponse(s)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @GrpcMethod('PortalQueryService', 'GetSessionAudit')
  async getSessionAudit(data: GetPortalSessionAuditRequest): Promise<GetPortalSessionAuditResponse> {
    this.logger.log(`GetSessionAudit for session: ${data.sessionId}`);

    const result = await this.portalQueryService.getSessionAudit({
      sessionId: data.sessionId,
      page: data.page,
      limit: data.limit,
    });

    return {
      events: result.events.map((e) => ({
        id: e.id,
        portalSessionId: e.portalSessionId,
        eventType: e.eventType,
        actorType: e.actorType,
        requestId: e.requestId ?? undefined,
        previousStatus: e.previousStatus ?? undefined,
        newStatus: e.newStatus ?? undefined,
        data: e.data,
        createdAt: e.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  private mapSessionToResponse(session: PortalPaymentSessionEntity): PortalSessionResponse {
    return {
      id: session.id,
      organisationId: session.organisationId,
      societeId: session.societeId,
      customerId: session.customerId,
      contractId: session.contractId ?? undefined,
      paymentIntentId: session.paymentIntentId ?? undefined,
      status: session.status,
      allowedActions: session.allowedActions,
      expiresAt: session.expiresAt.toISOString(),
      maxUses: session.maxUses,
      useCount: session.useCount,
      amountCents: Number(session.amountCents),
      currency: session.currency,
      description: session.description ?? undefined,
      mandateId: session.mandateId ?? undefined,
      rumMasked: session.rumMasked ?? undefined,
      pspProvider: session.pspProvider ?? undefined,
      pspSessionId: session.pspSessionId ?? undefined,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private buildRequestContext(data: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): RequestContext {
    return {
      ipHash: data.ipAddress ? this.hashString(data.ipAddress) : undefined,
      uaHash: data.userAgent ? this.hashString(data.userAgent) : undefined,
      requestId: data.requestId,
    };
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}

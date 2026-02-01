import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { createHash } from 'crypto';
import { PortalSessionService, RequestContext } from './portal-session.service';
import { PortalPSPService } from './portal-psp.service';
import { PortalQueryService } from './portal-query.service';
import {
  PortalPaymentSessionEntity,
  PortalSessionAction,
  PortalSessionStatus,
  PSPProvider,
} from './entities/portal-session.entity';
import { PortalSessionAuditEntity } from './entities/portal-session-audit.entity';

// Import all types from proto definitions
import type {
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  AccessPortalSessionRequest,
  AccessPortalSessionResponse,
  CancelPortalSessionRequest,
  CancelPortalSessionResponse,
  ListPortalSessionsRequest,
  ListPortalSessionsResponse,
  GetPortalSessionAuditRequest,
  GetPortalSessionAuditResponse,
  PortalPaymentSession,
  PortalSessionAuditLog,
  PortalRequestContext,
} from '@crm/proto/payments';

// Types for PSP operations (not yet in proto - internal service types)
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
  session: PortalPaymentSession;
}

interface HandlePSPReturnRequest {
  state: string;
  pspParams: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface HandlePSPReturnResponse {
  session: PortalPaymentSession;
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
      allowedActions: (data.allowedActions || []).map((a) => a as unknown as PortalSessionAction),
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
      session: this.mapSessionToProto(result.session),
      portalUrl: result.portalUrl,
      token: result.token,
      wasIdempotentHit: result.wasIdempotentHit,
    };
  }

  @GrpcMethod('PortalSessionService', 'GetSession')
  async getSession(data: AccessPortalSessionRequest): Promise<AccessPortalSessionResponse> {
    const requestContext = this.buildRequestContext(data);

    const session = await this.portalSessionService.accessSession(data.token, requestContext);

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      session: this.mapSessionToProto(session),
    };
  }

  @GrpcMethod('PortalSessionService', 'CancelSession')
  async cancelSession(data: CancelPortalSessionRequest): Promise<CancelPortalSessionResponse> {
    this.logger.log(`CancelSession: ${data.sessionId}`);

    const session = await this.portalSessionService.cancelSession(data.sessionId, data.reason);

    return {
      session: this.mapSessionToProto(session),
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
      session: this.mapSessionToProto(result.session),
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
      session: this.mapSessionToProto(result.session),
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
      contractId: undefined, // Not in proto request
      status: data.status as unknown as PortalSessionStatus,
      createdAfter: data.fromDate ? new Date(data.fromDate) : undefined,
      createdBefore: data.toDate ? new Date(data.toDate) : undefined,
      page: data.page,
      limit: data.limit,
    });

    return {
      sessions: result.sessions.map((s) => this.mapSessionToProto(s)),
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
      page: 1,
      limit: 100,
    });

    return {
      logs: result.events.map((e) => this.mapAuditLogToProto(e)),
    };
  }

  private mapSessionToProto(session: PortalPaymentSessionEntity): PortalPaymentSession {
    return {
      id: session.id,
      organisationId: session.organisationId,
      societeId: session.societeId,
      customerId: session.customerId,
      contractId: session.contractId ?? undefined,
      paymentIntentId: session.paymentIntentId ?? undefined,
      tokenVersion: '', // Not exposed
      status: session.status as unknown as number,
      allowedActions: session.allowedActions as unknown as number[],
      expiresAt: session.expiresAt.toISOString(),
      maxUses: session.maxUses,
      useCount: session.useCount,
      consumedAt: undefined,
      revokedAt: undefined,
      lastAccessedAt: undefined,
      amountCents: Number(session.amountCents),
      currency: session.currency,
      description: session.description ?? undefined,
      mandateId: session.mandateId ?? undefined,
      rumMasked: session.rumMasked ?? undefined,
      pspState: undefined,
      pspRedirectUrl: undefined,
      pspProvider: session.pspProvider as unknown as number | undefined,
      pspSessionId: session.pspSessionId ?? undefined,
      metadata: session.metadata ?? {},
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private mapAuditLogToProto(event: PortalSessionAuditEntity): PortalSessionAuditLog {
    return {
      id: event.id,
      portalSessionId: event.portalSessionId,
      eventType: event.eventType as unknown as number,
      actorType: event.actorType as unknown as number,
      previousStatus: event.previousStatus ?? undefined,
      newStatus: event.newStatus ?? undefined,
      ipAddressHash: undefined,
      userAgentHash: undefined,
      requestId: event.requestId ?? undefined,
      correlationId: undefined,
      data: event.data ?? {},
      timestamp: event.createdAt.toISOString(),
    };
  }

  private buildRequestContext(data: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    ipAddressHash?: string;
    userAgentHash?: string;
  }): RequestContext {
    return {
      ipHash: data.ipAddressHash || (data.ipAddress ? this.hashString(data.ipAddress) : undefined),
      uaHash: data.userAgentHash || (data.userAgent ? this.hashString(data.userAgent) : undefined),
      requestId: data.requestId,
    };
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}

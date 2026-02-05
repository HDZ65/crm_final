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
    this.logger.log(`CreateSession for customer: ${data.customer_id}`);

    const result = await this.portalSessionService.createSession({
      ...data,
      allowedActions: (data.allowed_actions || []).map((a) => a as unknown as PortalSessionAction),
      metadata: data.metadata ?? {},
    });

    return {
      session: this.mapSessionToProto(result.session),
      portal_url: result.portalUrl,
      token: result.token,
      was_idempotent_hit: result.wasIdempotentHit,
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
    this.logger.log(`CancelSession: ${data.session_id}`);

    const session = await this.portalSessionService.cancelSession(data.session_id, data.reason);

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
    this.logger.log(`ListSessions for organisation: ${data.organisation_id}`);

    const result = await this.portalQueryService.listSessions({
      organisation_id: data.organisation_id,
      customer_id: data.customer_id,
      contract_id: undefined, // Not in proto request
      status: data.status as unknown as PortalSessionStatus,
      createdAfter: data.from_date ? new Date(data.from_date) : undefined,
      createdBefore: data.to_date ? new Date(data.to_date) : undefined,
      page: data.page,
      limit: data.limit,
    });

    return {
      sessions: result.sessions.map((s) => this.mapSessionToProto(s)),
      total: result.total,
      page: result.page,
      total_pages: result.totalPages,
    };
  }

  @GrpcMethod('PortalQueryService', 'GetSessionAudit')
  async getSessionAudit(data: GetPortalSessionAuditRequest): Promise<GetPortalSessionAuditResponse> {
    this.logger.log(`GetSessionAudit for session: ${data.session_id}`);

    const result = await this.portalQueryService.getSessionAudit({
      session_id: data.session_id,
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
      organisation_id: session.organisationId,
      societe_id: session.societeId,
      customer_id: session.customerId,
      contract_id: session.contractId ?? undefined,
      payment_intent_id: session.paymentIntentId ?? undefined,
      token_version: '', // Not exposed
      status: session.status as unknown as number,
      allowed_actions: session.allowedActions as unknown as number[],
      expires_at: session.expiresAt.toISOString(),
      max_uses: session.maxUses,
      use_count: session.useCount,
      consumed_at: undefined,
      revoked_at: undefined,
      last_accessed_at: undefined,
      amount_cents: Number(session.amountCents),
      currency: session.currency,
      description: session.description ?? undefined,
      mandate_id: session.mandateId ?? undefined,
      rum_masked: session.rumMasked ?? undefined,
      psp_state: undefined,
      psp_redirect_url: undefined,
      psp_provider: session.pspProvider as unknown as number | undefined,
      psp_session_id: session.pspSessionId ?? undefined,
      metadata: session.metadata ?? {},
      created_at: session.createdAt.toISOString(),
      updated_at: session.updatedAt.toISOString(),
    };
  }

  private mapAuditLogToProto(event: PortalSessionAuditEntity): PortalSessionAuditLog {
    return {
      id: event.id,
      portal_session_id: event.portalSessionId,
      event_type: event.eventType as unknown as number,
      actor_type: event.actorType as unknown as number,
      previous_status: event.previousStatus ?? undefined,
      new_status: event.newStatus ?? undefined,
      ip_address_hash: undefined,
      user_agent_hash: undefined,
      request_id: event.requestId ?? undefined,
      correlation_id: undefined,
      data: event.data ?? {},
      timestamp: event.createdAt.toISOString(),
    };
  }

  private buildRequestContext(data: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    ip_address_hash?: string;
    user_agent_hash?: string;
  }): RequestContext {
    return {
      ipHash: data.ip_address_hash || (data.ipAddress ? this.hashString(data.ipAddress) : undefined),
      uaHash: data.user_agent_hash || (data.userAgent ? this.hashString(data.userAgent) : undefined),
      requestId: data.requestId,
    };
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import {
  PortalPaymentSessionEntity,
  PortalSessionStatus,
  PortalSessionAction,
} from './entities/portal-session.entity.js';
import {
  PortalSessionAuditEntity,
  AuditEventType,
  AuditActorType,
} from './entities/portal-session-audit.entity.js';

export interface CreateSessionParams {
  organisationId: string;
  societeId: string;
  customerId: string;
  contractId?: string;
  paymentIntentId?: string;
  allowedActions: PortalSessionAction[];
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

export interface CreateSessionResult {
  session: PortalPaymentSessionEntity;
  token: string;
  portalUrl: string;
  wasIdempotentHit: boolean;
}

export interface ValidateTokenResult {
  valid: boolean;
  session?: PortalPaymentSessionEntity;
  errorCode?: PortalErrorCode;
  errorMessage?: string;
}

export enum PortalErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_ALREADY_USED = 'SESSION_ALREADY_USED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  SESSION_TERMINAL = 'SESSION_TERMINAL',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_MALFORMED = 'TOKEN_MALFORMED',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  ACTION_NOT_ALLOWED = 'ACTION_NOT_ALLOWED',
}

const TOKEN_VERSION = 'v1';
const TOKEN_ENTROPY_BYTES = 32;
const DEFAULT_TTL_SECONDS = 900;
const DEFAULT_MAX_USES = 1;

@Injectable()
export class PortalSessionService {
  private readonly logger = new Logger(PortalSessionService.name);

  constructor(
    @InjectRepository(PortalPaymentSessionEntity)
    private readonly sessionRepository: Repository<PortalPaymentSessionEntity>,
    @InjectRepository(PortalSessionAuditEntity)
    private readonly auditRepository: Repository<PortalSessionAuditEntity>,
  ) {}

  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    const idempotencyKeyHash = params.idempotencyKey
      ? this.hashString(params.idempotencyKey)
      : null;

    if (idempotencyKeyHash) {
      const existing = await this.sessionRepository.findOne({
        where: { idempotencyKeyHash },
      });

      if (existing && !existing.isTerminal()) {
        this.logger.log(`Idempotent hit for session ${existing.id}`);
        return {
          session: existing,
          token: '',
          portalUrl: this.buildPortalUrl(''),
          wasIdempotentHit: true,
        };
      }
    }

    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const ttlSeconds = params.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const session = this.sessionRepository.create({
      organisationId: params.organisationId,
      societeId: params.societeId,
      customerId: params.customerId,
      contractId: params.contractId ?? null,
      paymentIntentId: params.paymentIntentId ?? null,
      tokenHash,
      tokenVersion: TOKEN_VERSION,
      status: PortalSessionStatus.CREATED,
      allowedActions: params.allowedActions,
      expiresAt,
      maxUses: params.maxUses ?? DEFAULT_MAX_USES,
      useCount: 0,
      idempotencyKeyHash,
      amountCents: params.amountCents,
      currency: params.currency ?? 'EUR',
      description: params.description ?? null,
      mandateId: params.mandateId ?? null,
      rumMasked: params.rumMasked ?? null,
      metadata: params.metadata ?? {},
    });

    const savedSession = await this.sessionRepository.save(session);

    await this.createAuditEntry({
      portalSessionId: savedSession.id,
      eventType: AuditEventType.SESSION_CREATED,
      actorType: AuditActorType.SYSTEM,
      newStatus: PortalSessionStatus.CREATED,
      data: {
        ttlSeconds: ttlSeconds.toString(),
        maxUses: (params.maxUses ?? DEFAULT_MAX_USES).toString(),
        amountCents: params.amountCents.toString(),
        currency: params.currency ?? 'EUR',
      },
    });

    this.logger.log(`Created portal session ${savedSession.id} for customer ${params.customerId}`);

    return {
      session: savedSession,
      token,
      portalUrl: this.buildPortalUrl(token),
      wasIdempotentHit: false,
    };
  }

  async validateToken(token: string, requestContext?: RequestContext): Promise<ValidateTokenResult> {
    if (!this.isValidTokenFormat(token)) {
      return {
        valid: false,
        errorCode: PortalErrorCode.TOKEN_MALFORMED,
        errorMessage: 'Invalid token format',
      };
    }

    const tokenHash = this.hashToken(token);
    const session = await this.sessionRepository.findOne({
      where: { tokenHash },
    });

    if (!session) {
      await this.logFailedValidation(requestContext, PortalErrorCode.SESSION_NOT_FOUND);
      return {
        valid: false,
        errorCode: PortalErrorCode.SESSION_NOT_FOUND,
        errorMessage: 'Session not found',
      };
    }

    if (session.revokedAt) {
      await this.logFailedValidation(requestContext, PortalErrorCode.SESSION_REVOKED, session.id);
      return {
        valid: false,
        session,
        errorCode: PortalErrorCode.SESSION_REVOKED,
        errorMessage: 'Session has been revoked',
      };
    }

    if (session.isExpired()) {
      await this.transitionStatus(session, PortalSessionStatus.EXPIRED, AuditActorType.SYSTEM);
      return {
        valid: false,
        session,
        errorCode: PortalErrorCode.SESSION_EXPIRED,
        errorMessage: 'Session has expired',
      };
    }

    if (session.isTerminal()) {
      return {
        valid: false,
        session,
        errorCode: PortalErrorCode.SESSION_TERMINAL,
        errorMessage: 'Session is in terminal state',
      };
    }

    await this.createAuditEntry({
      portalSessionId: session.id,
      eventType: AuditEventType.TOKEN_VALIDATED,
      actorType: AuditActorType.PORTAL_TOKEN,
      ipAddressHash: requestContext?.ipHash,
      userAgentHash: requestContext?.uaHash,
      requestId: requestContext?.requestId,
    });

    return { valid: true, session };
  }

  async accessSession(token: string, requestContext?: RequestContext): Promise<PortalPaymentSessionEntity> {
    const validation = await this.validateToken(token, requestContext);

    if (!validation.valid || !validation.session) {
      throw new BadRequestException(validation.errorMessage ?? 'Invalid or expired link');
    }

    const session = validation.session;

    session.lastAccessedAt = new Date();

    if (session.status === PortalSessionStatus.CREATED) {
      await this.transitionStatus(session, PortalSessionStatus.ACTIVE, AuditActorType.PORTAL_TOKEN, requestContext);
    } else {
      await this.sessionRepository.save(session);
      await this.createAuditEntry({
        portalSessionId: session.id,
        eventType: AuditEventType.SESSION_ACCESSED,
        actorType: AuditActorType.PORTAL_TOKEN,
        ipAddressHash: requestContext?.ipHash,
        userAgentHash: requestContext?.uaHash,
        requestId: requestContext?.requestId,
      });
    }

    return session;
  }

  async consumeToken(
    token: string,
    action: PortalSessionAction,
    requestContext?: RequestContext,
  ): Promise<PortalPaymentSessionEntity> {
    const validation = await this.validateToken(token, requestContext);

    if (!validation.valid || !validation.session) {
      throw new BadRequestException(validation.errorMessage ?? 'Invalid or expired link');
    }

    const session = validation.session;

    if (!session.hasAction(action)) {
      throw new BadRequestException(`Action ${action} not allowed for this session`);
    }

    if (!session.canConsume()) {
      throw new ConflictException('Session has already been consumed');
    }

    session.useCount += 1;
    session.consumedAt = new Date();
    await this.sessionRepository.save(session);

    await this.createAuditEntry({
      portalSessionId: session.id,
      eventType: AuditEventType.PAYMENT_INITIATED,
      actorType: AuditActorType.PORTAL_TOKEN,
      ipAddressHash: requestContext?.ipHash,
      userAgentHash: requestContext?.uaHash,
      requestId: requestContext?.requestId,
      data: { action, useCount: session.useCount.toString() },
    });

    this.logger.log(`Token consumed for session ${session.id}, use ${session.useCount}/${session.maxUses}`);

    return session;
  }

  async getSessionById(sessionId: string): Promise<PortalPaymentSessionEntity | null> {
    return this.sessionRepository.findOne({ where: { id: sessionId } });
  }

  async cancelSession(
    sessionId: string,
    reason?: string,
    actorType: AuditActorType = AuditActorType.ADMIN,
  ): Promise<PortalPaymentSessionEntity> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.isTerminal()) {
      throw new BadRequestException('Cannot cancel a session in terminal state');
    }

    await this.transitionStatus(session, PortalSessionStatus.CANCELLED, actorType, undefined, reason ? { reason } : undefined);

    return session;
  }

  async transitionStatus(
    session: PortalPaymentSessionEntity,
    newStatus: PortalSessionStatus,
    actorType: AuditActorType,
    requestContext?: RequestContext,
    additionalData?: Record<string, string>,
  ): Promise<void> {
    const previousStatus = session.status;

    if (!session.canTransitionTo(newStatus)) {
      this.logger.warn(
        `Invalid transition attempt: ${session.id} from ${previousStatus} to ${newStatus}`,
      );
      throw new BadRequestException(
        `Cannot transition from ${previousStatus} to ${newStatus}`,
      );
    }

    session.status = newStatus;
    await this.sessionRepository.save(session);

    const eventTypeMap: Record<PortalSessionStatus, AuditEventType> = {
      [PortalSessionStatus.CREATED]: AuditEventType.SESSION_CREATED,
      [PortalSessionStatus.ACTIVE]: AuditEventType.SESSION_ACTIVATED,
      [PortalSessionStatus.REDIRECTED]: AuditEventType.REDIRECT_INITIATED,
      [PortalSessionStatus.COMPLETED]: AuditEventType.PAYMENT_COMPLETED,
      [PortalSessionStatus.FAILED]: AuditEventType.PAYMENT_FAILED,
      [PortalSessionStatus.EXPIRED]: AuditEventType.SESSION_EXPIRED,
      [PortalSessionStatus.CANCELLED]: AuditEventType.SESSION_CANCELLED,
    };

    await this.createAuditEntry({
      portalSessionId: session.id,
      eventType: eventTypeMap[newStatus],
      actorType,
      previousStatus,
      newStatus,
      ipAddressHash: requestContext?.ipHash,
      userAgentHash: requestContext?.uaHash,
      requestId: requestContext?.requestId,
      data: additionalData,
    });

    this.logger.log(`Session ${session.id} transitioned: ${previousStatus} → ${newStatus}`);
  }

  async updatePSPInfo(
    session: PortalPaymentSessionEntity,
    pspInfo: {
      pspState: string;
      pspRedirectUrl: string;
      pspProvider: string;
      pspSessionId: string;
    },
  ): Promise<void> {
    session.pspState = pspInfo.pspState;
    session.pspRedirectUrl = pspInfo.pspRedirectUrl;
    session.pspProvider = pspInfo.pspProvider as any;
    session.pspSessionId = pspInfo.pspSessionId;
    await this.sessionRepository.save(session);
  }

  async findByPspState(pspState: string): Promise<PortalPaymentSessionEntity | null> {
    return this.sessionRepository.findOne({ where: { pspState } });
  }

  private generateToken(): string {
    const randomPart = randomBytes(TOKEN_ENTROPY_BYTES).toString('base64url');
    return `${TOKEN_VERSION}.${randomPart}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex');
  }

  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [version, payload] = parts;
    if (version !== TOKEN_VERSION) return false;
    if (payload.length < 40) return false;
    return /^[A-Za-z0-9_-]+$/.test(payload);
  }

  private buildPortalUrl(token: string): string {
    const baseUrl = process.env.PORTAL_BASE_URL ?? 'https://portal.example.com';
    return `${baseUrl}/p/${token}`;
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
    correlationId?: string;
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
      correlationId: params.correlationId ?? null,
      data: params.data ?? {},
    });

    await this.auditRepository.save(audit);
  }

  private async logFailedValidation(
    requestContext: RequestContext | undefined,
    errorCode: PortalErrorCode,
    sessionId?: string,
  ): Promise<void> {
    if (sessionId) {
      await this.createAuditEntry({
        portalSessionId: sessionId,
        eventType: AuditEventType.TOKEN_REJECTED,
        actorType: AuditActorType.PORTAL_TOKEN,
        ipAddressHash: requestContext?.ipHash,
        userAgentHash: requestContext?.uaHash,
        requestId: requestContext?.requestId,
        data: { errorCode },
      });
    }
    this.logger.warn(`Token validation failed: ${errorCode}`);
  }
}

export interface RequestContext {
  ipHash?: string;
  uaHash?: string;
  requestId?: string;
  correlationId?: string;
}

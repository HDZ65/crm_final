import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { PortalSessionService } from '../portal-session.service.js';
import { PortalPSPService } from '../portal-psp.service.js';
import { PortalQueryService } from '../portal-query.service.js';
import {
  PortalPaymentSessionEntity,
  PortalSessionStatus,
  PortalSessionAction,
  PSPProvider,
} from '../entities/portal-session.entity.js';
import { PortalSessionAuditEntity, AuditEventType } from '../entities/portal-session-audit.entity.js';
import { PSPEventInboxEntity, WebhookEventStatus } from '../entities/psp-event-inbox.entity.js';
import { StripeService } from '../../stripe/stripe.service.js';
import { GoCardlessService } from '../../gocardless/gocardless.service.js';

describe('Portal Integration Tests', () => {
  let portalSessionService: PortalSessionService;
  let portalPSPService: PortalPSPService;
  let portalQueryService: PortalQueryService;
  let sessionRepository: jest.Mocked<Repository<PortalPaymentSessionEntity>>;
  let auditRepository: jest.Mocked<Repository<PortalSessionAuditEntity>>;
  let eventInboxRepository: jest.Mocked<Repository<PSPEventInboxEntity>>;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuditRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockEventInboxRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockStripeService = {
    createCheckoutSession: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };

  const mockGoCardlessService = {
    createBillingRequest: jest.fn(),
    createPayment: jest.fn(),
    getActiveMandate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalSessionService,
        PortalPSPService,
        PortalQueryService,
        {
          provide: getRepositoryToken(PortalPaymentSessionEntity),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(PortalSessionAuditEntity),
          useValue: mockAuditRepository,
        },
        {
          provide: getRepositoryToken(PSPEventInboxEntity),
          useValue: mockEventInboxRepository,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: GoCardlessService,
          useValue: mockGoCardlessService,
        },
      ],
    }).compile();

    portalSessionService = module.get<PortalSessionService>(PortalSessionService);
    portalPSPService = module.get<PortalPSPService>(PortalPSPService);
    portalQueryService = module.get<PortalQueryService>(PortalQueryService);
    sessionRepository = module.get(getRepositoryToken(PortalPaymentSessionEntity));
    auditRepository = module.get(getRepositoryToken(PortalSessionAuditEntity));
    eventInboxRepository = module.get(getRepositoryToken(PSPEventInboxEntity));

    jest.clearAllMocks();
  });

  describe('Complete Payment Flow', () => {
    it('should complete full flow: create → access → redirect → webhook → complete', async () => {
      const auditEvents: any[] = [];
      
      mockSessionRepository.findOne.mockResolvedValue(null);
      mockAuditRepository.create.mockImplementation((data) => {
        auditEvents.push(data);
        return data;
      });
      mockAuditRepository.save.mockImplementation((data) => Promise.resolve(data));

      let currentSession: any = null;
      mockSessionRepository.create.mockImplementation((data) => {
        currentSession = {
          id: 'test-session-id',
          ...data,
          status: PortalSessionStatus.CREATED,
          useCount: 0,
          isExpired: () => false,
          isTerminal: () => currentSession?.status === PortalSessionStatus.COMPLETED,
          canConsume: () => currentSession?.useCount < currentSession?.maxUses && !currentSession?.consumedAt,
          canTransitionTo: (newStatus: PortalSessionStatus) => {
            const transitions: Record<string, string[]> = {
              CREATED: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
              ACTIVE: ['REDIRECTED', 'EXPIRED', 'CANCELLED'],
              REDIRECTED: ['COMPLETED', 'FAILED', 'EXPIRED'],
            };
            return transitions[currentSession?.status]?.includes(newStatus) ?? false;
          },
          hasAction: () => true,
        };
        return currentSession;
      });
      mockSessionRepository.save.mockImplementation((session) => {
        currentSession = { ...currentSession, ...session };
        return Promise.resolve(currentSession);
      });

      const createResult = await portalSessionService.createSession({
        organisationId: 'org-id',
        societeId: 'societe-id',
        customerId: 'customer-id',
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        amountCents: 15000,
        currency: 'EUR',
      });

      expect(createResult.session).toBeDefined();
      expect(createResult.token).toMatch(/^v1\./);
      expect(createResult.portalUrl).toContain(createResult.token);
      expect(auditEvents.some(e => e.eventType === AuditEventType.SESSION_CREATED)).toBe(true);

      const tokenHash = createHash('sha256').update(createResult.token).digest('hex');
      mockSessionRepository.findOne.mockResolvedValue({
        ...currentSession,
        tokenHash,
        status: PortalSessionStatus.CREATED,
      });

      const accessedSession = await portalSessionService.accessSession(createResult.token);
      
      expect(accessedSession.status).toBe(PortalSessionStatus.ACTIVE);
      expect(accessedSession.lastAccessedAt).toBeDefined();

      mockSessionRepository.findOne.mockResolvedValue({
        ...currentSession,
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        useCount: 0,
        consumedAt: null,
        isExpired: () => false,
        isTerminal: () => false,
        canConsume: () => true,
        canTransitionTo: () => true,
        hasAction: () => true,
      });

      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_test_123',
        sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      const redirectResult = await portalPSPService.startRedirect({
        token: createResult.token,
        paymentMethod: 'CARD',
        successUrl: 'https://portal.example.com/success',
        cancelUrl: 'https://portal.example.com/cancel',
      });

      expect(redirectResult.redirectUrl).toContain('stripe.com');
      expect(redirectResult.pspSessionId).toBe('cs_test_123');

      const webhookPayload = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              portalSessionId: 'test-session-id',
            },
          },
        },
      };

      mockEventInboxRepository.findOne.mockResolvedValue(null);
      mockEventInboxRepository.create.mockImplementation((data) => ({
        id: 'event-id',
        ...data,
        markVerified: function() { this.status = WebhookEventStatus.VERIFIED; },
        markProcessed: function() { this.status = WebhookEventStatus.PROCESSED; },
      }));
      mockEventInboxRepository.save.mockImplementation((data) => Promise.resolve(data));

      mockSessionRepository.findOne.mockResolvedValue({
        ...currentSession,
        id: 'test-session-id',
        status: PortalSessionStatus.REDIRECTED,
        canTransitionTo: () => true,
      });

      const webhookResult = await portalPSPService.handleWebhook({
        provider: PSPProvider.STRIPE,
        rawBody: JSON.stringify(webhookPayload),
        signature: 'test-signature',
        headers: {},
      });

      expect(webhookResult.acknowledged).toBe(true);
      expect(webhookResult.status).toBe(WebhookEventStatus.PROCESSED);
    });
  });

  describe('Webhook Idempotency', () => {
    it('should detect and handle duplicate webhooks', async () => {
      const webhookPayload = {
        id: 'evt_duplicate_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123' } },
      };

      const existingEvent = {
        id: 'existing-event-id',
        pspProvider: PSPProvider.STRIPE,
        pspEventId: 'evt_duplicate_123',
        status: WebhookEventStatus.PROCESSED,
      };

      mockEventInboxRepository.findOne.mockResolvedValue(existingEvent);

      const result = await portalPSPService.handleWebhook({
        provider: PSPProvider.STRIPE,
        rawBody: JSON.stringify(webhookPayload),
        signature: 'test-signature',
        headers: {},
      });

      expect(result.status).toBe(WebhookEventStatus.DUPLICATE);
      expect(result.acknowledged).toBe(true);
      expect(mockEventInboxRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Webhook Before User Return', () => {
    it('should handle webhook arriving before user returns', async () => {
      const pspState = randomBytes(32).toString('base64url');

      const session = {
        id: 'session-id',
        status: PortalSessionStatus.COMPLETED,
        pspState,
      };

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const returnResult = await portalPSPService.handleReturn({
        state: pspState,
        pspParams: { session_id: 'cs_123' },
      });

      expect(returnResult.paymentConfirmed).toBe(true);
      expect(returnResult.pendingConfirmation).toBe(false);
      expect(returnResult.message).toBe('Paiement confirmé');
    });
  });

  describe('User Return Before Webhook', () => {
    it('should show pending status when webhook not yet received', async () => {
      const pspState = randomBytes(32).toString('base64url');

      const session = {
        id: 'session-id',
        status: PortalSessionStatus.REDIRECTED,
        pspState,
      };

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const returnResult = await portalPSPService.handleReturn({
        state: pspState,
        pspParams: { session_id: 'cs_123' },
      });

      expect(returnResult.paymentConfirmed).toBe(false);
      expect(returnResult.pendingConfirmation).toBe(true);
      expect(returnResult.message).toBe('Paiement en cours de traitement...');
    });
  });

  describe('Invalid State on Return', () => {
    it('should reject return with invalid state', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(
        portalPSPService.handleReturn({
          state: 'invalid-state',
          pspParams: {},
        }),
      ).rejects.toThrow('Invalid or expired state');
    });
  });

  describe('Session Listing and Audit', () => {
    it('should list sessions with filters', async () => {
      const sessions = [
        { id: 'session-1', status: PortalSessionStatus.COMPLETED },
        { id: 'session-2', status: PortalSessionStatus.COMPLETED },
      ];

      mockSessionRepository.findAndCount.mockResolvedValue([sessions, 2]);

      const result = await portalQueryService.listSessions({
        organisationId: 'org-id',
        status: PortalSessionStatus.COMPLETED,
        page: 1,
        limit: 10,
      });

      expect(result.sessions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should return audit trail for session', async () => {
      const auditEvents = [
        { id: 'audit-1', eventType: AuditEventType.SESSION_CREATED },
        { id: 'audit-2', eventType: AuditEventType.SESSION_ACTIVATED },
        { id: 'audit-3', eventType: AuditEventType.REDIRECT_INITIATED },
        { id: 'audit-4', eventType: AuditEventType.PAYMENT_COMPLETED },
      ];

      mockAuditRepository.findAndCount.mockResolvedValue([auditEvents, 4]);

      const result = await portalQueryService.getSessionAudit({
        sessionId: 'session-id',
        page: 1,
        limit: 50,
      });

      expect(result.events).toHaveLength(4);
      expect(result.total).toBe(4);
    });
  });

  describe('Session Expiration', () => {
    it('should mark expired sessions', async () => {
      const expiredSessions = [
        {
          id: 'expired-1',
          status: PortalSessionStatus.CREATED,
          expiresAt: new Date(Date.now() - 60000),
        },
        {
          id: 'expired-2',
          status: PortalSessionStatus.ACTIVE,
          expiresAt: new Date(Date.now() - 30000),
        },
      ];

      mockSessionRepository.find.mockResolvedValue(expiredSessions);
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const count = await portalQueryService.markExpiredSessions();

      expect(count).toBe(2);
      expect(mockSessionRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('SEPA Payment Flow', () => {
    it('should create SEPA payment with existing mandate', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const session = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        societeId: 'societe-id',
        customerId: 'customer-id',
        mandateId: 'mandate-id',
        amountCents: 5000,
        currency: 'EUR',
        description: 'Monthly payment',
        expiresAt: new Date(Date.now() + 60000),
        useCount: 0,
        maxUses: 1,
        consumedAt: null,
        allowedActions: [PortalSessionAction.PAY_BY_SEPA],
        isExpired: () => false,
        isTerminal: () => false,
        canConsume: () => true,
        canTransitionTo: () => true,
        hasAction: (action: PortalSessionAction) => action === PortalSessionAction.PAY_BY_SEPA,
      };

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockSessionRepository.save.mockImplementation((s) => Promise.resolve(s));
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      mockGoCardlessService.getActiveMandate.mockResolvedValue({
        id: 'mandate-id',
        mandateId: 'MD123',
        status: 'active',
      });

      mockGoCardlessService.createPayment.mockResolvedValue({
        paymentId: 'PM123',
        status: 'pending_submission',
        chargeDate: '2026-01-25',
      });

      const result = await portalPSPService.startRedirect({
        token,
        paymentMethod: 'SEPA_DEBIT',
        successUrl: 'https://portal.example.com/success',
        cancelUrl: 'https://portal.example.com/cancel',
      });

      expect(result.pspSessionId).toBe('PM123');
      expect(mockGoCardlessService.createPayment).toHaveBeenCalledWith(
        'societe-id',
        expect.objectContaining({
          mandateId: 'mandate-id',
          amount: 50,
          currency: 'EUR',
        }),
      );
    });
  });
});

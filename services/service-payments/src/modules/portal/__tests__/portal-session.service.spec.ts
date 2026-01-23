import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { PortalSessionService, PortalErrorCode } from '../portal-session.service';
import {
  PortalPaymentSessionEntity,
  PortalSessionStatus,
  PortalSessionAction,
} from '../entities/portal-session.entity';
import { PortalSessionAuditEntity } from '../entities/portal-session-audit.entity';

describe('PortalSessionService', () => {
  let service: PortalSessionService;
  let sessionRepository: jest.Mocked<Repository<PortalPaymentSessionEntity>>;
  let auditRepository: jest.Mocked<Repository<PortalSessionAuditEntity>>;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAuditRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalSessionService,
        {
          provide: getRepositoryToken(PortalPaymentSessionEntity),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(PortalSessionAuditEntity),
          useValue: mockAuditRepository,
        },
      ],
    }).compile();

    service = module.get<PortalSessionService>(PortalSessionService);
    sessionRepository = module.get(getRepositoryToken(PortalPaymentSessionEntity));
    auditRepository = module.get(getRepositoryToken(PortalSessionAuditEntity));

    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate token with correct format', async () => {
      const mockSession = {
        id: 'test-session-id',
        status: PortalSessionStatus.CREATED,
      };

      mockSessionRepository.findOne.mockResolvedValue(null);
      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.createSession({
        organisationId: 'org-id',
        societeId: 'societe-id',
        customerId: 'customer-id',
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        amountCents: 10000,
        metadata: {},
      });

      expect(result.token).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
      expect(result.token.split('.')[0]).toBe('v1');
      expect(result.token.split('.')[1].length).toBeGreaterThanOrEqual(40);
    });

    it('should generate unique tokens', async () => {
      const tokens = new Set<string>();
      const iterations = 100;

      mockSessionRepository.findOne.mockResolvedValue(null);
      mockSessionRepository.create.mockImplementation((data) => ({
        id: `session-${tokens.size}`,
        ...data,
      }));
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      for (let i = 0; i < iterations; i++) {
        const result = await service.createSession({
          organisationId: 'org-id',
          societeId: 'societe-id',
          customerId: 'customer-id',
          allowedActions: [PortalSessionAction.PAY_BY_CARD],
          amountCents: 10000,
          metadata: {},
        });
        tokens.add(result.token);
      }

      expect(tokens.size).toBe(iterations);
    });

    it('should store only token hash, not plaintext', async () => {
      let storedTokenHash: string | null = null;

      mockSessionRepository.findOne.mockResolvedValue(null);
      mockSessionRepository.create.mockImplementation((data) => {
        storedTokenHash = data.tokenHash;
        return { id: 'test-id', ...data };
      });
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.createSession({
        organisationId: 'org-id',
        societeId: 'societe-id',
        customerId: 'customer-id',
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        amountCents: 10000,
        metadata: {},
      });

      expect(storedTokenHash).not.toBe(result.token);
      expect(storedTokenHash).toHaveLength(64);

      const expectedHash = createHash('sha256').update(result.token).digest('hex');
      expect(storedTokenHash).toBe(expectedHash);
    });
  });

  describe('Token Validation', () => {
    it('should validate correct token', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        isExpired: () => false,
        isTerminal: () => false,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should reject malformed token - missing version', async () => {
      const result = await service.validateToken('invalid-token-no-dot');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.TOKEN_MALFORMED);
    });

    it('should reject malformed token - wrong version', async () => {
      const result = await service.validateToken('v2.somebase64payload');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.TOKEN_MALFORMED);
    });

    it('should reject malformed token - too short', async () => {
      const result = await service.validateToken('v1.short');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.TOKEN_MALFORMED);
    });

    it('should reject unknown token', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      mockSessionRepository.findOne.mockResolvedValue(null);

      const result = await service.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.SESSION_NOT_FOUND);
    });

    it('should reject expired token', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 60000),
        revokedAt: null,
        isExpired: () => true,
        isTerminal: () => false,
        canTransitionTo: () => true,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.SESSION_EXPIRED);
    });

    it('should reject revoked token', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: new Date(),
        isExpired: () => false,
        isTerminal: () => false,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.SESSION_REVOKED);
    });

    it('should reject terminal session', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.COMPLETED,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        isExpired: () => false,
        isTerminal: () => true,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(PortalErrorCode.SESSION_TERMINAL);
    });
  });

  describe('Idempotency', () => {
    it('should return existing session for same idempotency key', async () => {
      const idempotencyKey = 'customer:contract:pay:123';
      const existingSession = {
        id: 'existing-session-id',
        status: PortalSessionStatus.CREATED,
        isTerminal: () => false,
      };

      mockSessionRepository.findOne.mockResolvedValue(existingSession);

      const result = await service.createSession({
        organisationId: 'org-id',
        societeId: 'societe-id',
        customerId: 'customer-id',
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        amountCents: 10000,
        idempotencyKey,
        metadata: {},
      });

      expect(result.wasIdempotentHit).toBe(true);
      expect(result.session.id).toBe('existing-session-id');
      expect(result.token).toBe('');
    });

    it('should create new session if existing is terminal', async () => {
      const idempotencyKey = 'customer:contract:pay:123';
      const terminalSession = {
        id: 'terminal-session-id',
        status: PortalSessionStatus.COMPLETED,
        isTerminal: () => true,
      };

      mockSessionRepository.findOne
        .mockResolvedValueOnce(terminalSession)
        .mockResolvedValueOnce(null);

      const newSession = { id: 'new-session-id' };
      mockSessionRepository.create.mockReturnValue(newSession);
      mockSessionRepository.save.mockResolvedValue(newSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.createSession({
        organisationId: 'org-id',
        societeId: 'societe-id',
        customerId: 'customer-id',
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        amountCents: 10000,
        idempotencyKey,
        metadata: {},
      });

      expect(result.wasIdempotentHit).toBe(false);
      expect(result.token).not.toBe('');
    });
  });

  describe('Token Consumption', () => {
    it('should consume token and increment use count', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        useCount: 0,
        maxUses: 1,
        consumedAt: null,
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        isExpired: () => false,
        isTerminal: () => false,
        canConsume: () => true,
        hasAction: (action: PortalSessionAction) => action === PortalSessionAction.PAY_BY_CARD,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      const result = await service.consumeToken(token, PortalSessionAction.PAY_BY_CARD);

      expect(result.useCount).toBe(1);
      expect(result.consumedAt).toBeDefined();
    });

    it('should reject consuming already consumed token', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        useCount: 1,
        maxUses: 1,
        consumedAt: new Date(),
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        isExpired: () => false,
        isTerminal: () => false,
        canConsume: () => false,
        hasAction: () => true,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      await expect(
        service.consumeToken(token, PortalSessionAction.PAY_BY_CARD),
      ).rejects.toThrow('Session has already been consumed');
    });

    it('should reject action not in allowed list', async () => {
      const token = 'v1.' + randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const mockSession = {
        id: 'session-id',
        tokenHash,
        status: PortalSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        useCount: 0,
        maxUses: 1,
        consumedAt: null,
        allowedActions: [PortalSessionAction.PAY_BY_CARD],
        isExpired: () => false,
        isTerminal: () => false,
        canConsume: () => true,
        hasAction: (action: PortalSessionAction) => action === PortalSessionAction.PAY_BY_CARD,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAuditRepository.create.mockReturnValue({});
      mockAuditRepository.save.mockResolvedValue({});

      await expect(
        service.consumeToken(token, PortalSessionAction.SETUP_SEPA),
      ).rejects.toThrow('Action SETUP_SEPA not allowed for this session');
    });
  });
});

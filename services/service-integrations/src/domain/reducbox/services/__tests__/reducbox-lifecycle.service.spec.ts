/**
 * Integration Test — ReducBoxLifecycleService
 *
 * Validates the ReducBox lifecycle chain:
 *   createAccess  → port.createAccess → repository.create → NATS event
 *   suspendAccess → port.suspendAccess → repository.update → NATS event
 *   restoreAccess → port.restoreAccess → repository.update → NATS event
 *
 * All external dependencies are mocked (no real DB / NATS / external API).
 */
import { beforeEach, describe, expect, it, jest } from 'bun:test';
import type { NatsService } from '@crm/shared-kernel';
import type { ReducBoxAccessRepositoryService } from '../../../../infrastructure/persistence/typeorm/repositories/reducbox';
import { ReducBoxAccessEntity, ReducBoxAccessStatus } from '../../entities/reducbox-access.entity';
import type { ReducBoxPort } from '../../ports/reducbox.port';
import { ReducBoxLifecycleService } from '../reducbox-lifecycle.service';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeAccess(overrides: Partial<ReducBoxAccessEntity> = {}): ReducBoxAccessEntity {
  const entity = new ReducBoxAccessEntity();
  entity.id = 'access-001';
  entity.clientId = 'client-001';
  entity.contratId = 'contrat-001';
  entity.externalAccessId = 'ext-abc-123';
  entity.status = ReducBoxAccessStatus.ACTIVE;
  entity.suspendedAt = null;
  entity.restoredAt = null;
  entity.cancelledAt = null;
  entity.createdAt = new Date('2026-01-01');
  entity.updatedAt = new Date('2026-01-01');
  entity.history = [];
  Object.assign(entity, overrides);
  return entity;
}

// ---------------------------------------------------------------------------
// Mock builders
// ---------------------------------------------------------------------------

function createMocks() {
  const publishedEvents: Array<{ subject: string; payload: unknown }> = [];

  const reducBoxPort: ReducBoxPort = {
    createAccess: jest.fn(async () => ({ externalAccessId: 'ext-abc-123' })),
    suspendAccess: jest.fn(async () => undefined),
    restoreAccess: jest.fn(async () => undefined),
    cancelAccess: jest.fn(async () => undefined),
  };

  const reducBoxAccessRepository = {
    create: jest.fn(async (data: Partial<ReducBoxAccessEntity>) => {
      const entity = makeAccess({
        clientId: data.clientId,
        contratId: data.contratId,
        externalAccessId: data.externalAccessId ?? null,
        status: data.status ?? ReducBoxAccessStatus.PENDING,
      });
      return entity;
    }),
    findById: jest.fn(async () => makeAccess()),
    update: jest.fn(async (entity: ReducBoxAccessEntity) => entity),
    addHistory: jest.fn(async () => ({})),
  } as unknown as ReducBoxAccessRepositoryService;

  const natsService = {
    publish: jest.fn(async (subject: string, payload: unknown) => {
      publishedEvents.push({ subject, payload });
    }),
    isConnected: jest.fn(() => true),
  } as unknown as NatsService;

  return { reducBoxPort, reducBoxAccessRepository, natsService, publishedEvents };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new ReducBoxLifecycleService(mocks.reducBoxPort, mocks.reducBoxAccessRepository, mocks.natsService);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReducBoxLifecycleService', () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ReducBoxLifecycleService;

  beforeEach(() => {
    mocks = createMocks();
    service = createService(mocks);
  });

  // -----------------------------------------------------------------------
  // createAccess
  // -----------------------------------------------------------------------
  describe('createAccess()', () => {
    it('should call reducBoxPort.createAccess with clientId and contratId', async () => {
      await service.createAccess('client-001', 'contrat-001');

      expect(mocks.reducBoxPort.createAccess).toHaveBeenCalledWith('client-001', 'contrat-001');
    });

    it('should persist access entity via repository with ACTIVE status', async () => {
      await service.createAccess('client-001', 'contrat-001');

      expect(mocks.reducBoxAccessRepository.create).toHaveBeenCalledWith({
        clientId: 'client-001',
        contratId: 'contrat-001',
        externalAccessId: 'ext-abc-123',
        status: ReducBoxAccessStatus.ACTIVE,
      });
    });

    it('should record history entry for initial creation', async () => {
      await service.createAccess('client-001', 'contrat-001');

      expect(mocks.reducBoxAccessRepository.addHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          accessId: 'access-001',
          previousStatus: ReducBoxAccessStatus.PENDING,
          newStatus: ReducBoxAccessStatus.ACTIVE,
          reason: 'Initial access creation',
          changedBy: 'system',
        }),
      );
    });

    it('should publish crm.commercial.reducbox.access.created event', async () => {
      await service.createAccess('client-001', 'contrat-001');

      expect(mocks.publishedEvents.length).toBe(1);
      expect(mocks.publishedEvents[0].subject).toBe('crm.commercial.reducbox.access.created');

      const payload = mocks.publishedEvents[0].payload as Record<string, unknown>;
      expect(payload.accessId).toBe('access-001');
      expect(payload.clientId).toBe('client-001');
      expect(payload.contratId).toBe('contrat-001');
      expect(payload.externalAccessId).toBe('ext-abc-123');
      expect(payload.status).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(payload.occurredAt).toBeDefined();
    });

    it('should return the created access entity', async () => {
      const result = await service.createAccess('client-001', 'contrat-001');

      expect(result.id).toBe('access-001');
      expect(result.clientId).toBe('client-001');
      expect(result.externalAccessId).toBe('ext-abc-123');
      expect(result.status).toBe(ReducBoxAccessStatus.ACTIVE);
    });

    it('should propagate error when port fails', async () => {
      (mocks.reducBoxPort.createAccess as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('EXTERNAL_API_DOWN'));

      await expect(service.createAccess('client-001', 'contrat-001')).rejects.toThrow('EXTERNAL_API_DOWN');
    });
  });

  // -----------------------------------------------------------------------
  // suspendAccess
  // -----------------------------------------------------------------------
  describe('suspendAccess()', () => {
    it('should call reducBoxPort.suspendAccess with externalAccessId and reason', async () => {
      await service.suspendAccess('access-001', 'Non-payment');

      expect(mocks.reducBoxPort.suspendAccess).toHaveBeenCalledWith('ext-abc-123', 'Non-payment');
    });

    it('should update access entity status to SUSPENDED', async () => {
      await service.suspendAccess('access-001', 'Non-payment');

      expect(mocks.reducBoxAccessRepository.update).toHaveBeenCalledTimes(1);
      const updatedEntity = (mocks.reducBoxAccessRepository.update as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(updatedEntity.status).toBe(ReducBoxAccessStatus.SUSPENDED);
      expect(updatedEntity.suspendedAt).toBeInstanceOf(Date);
    });

    it('should record history entry for suspension', async () => {
      await service.suspendAccess('access-001', 'Non-payment');

      expect(mocks.reducBoxAccessRepository.addHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          accessId: 'access-001',
          previousStatus: ReducBoxAccessStatus.ACTIVE,
          newStatus: ReducBoxAccessStatus.SUSPENDED,
          reason: 'Non-payment',
          changedBy: 'system',
        }),
      );
    });

    it('should publish crm.commercial.reducbox.access.suspended event', async () => {
      await service.suspendAccess('access-001', 'Non-payment');

      expect(mocks.publishedEvents.length).toBe(1);
      expect(mocks.publishedEvents[0].subject).toBe('crm.commercial.reducbox.access.suspended');

      const payload = mocks.publishedEvents[0].payload as Record<string, unknown>;
      expect(payload.accessId).toBe('access-001');
      expect(payload.previousStatus).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(payload.status).toBe(ReducBoxAccessStatus.SUSPENDED);
      expect(payload.reason).toBe('Non-payment');
      expect(payload.occurredAt).toBeDefined();
    });

    it('should throw when access not found', async () => {
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      await expect(service.suspendAccess('unknown-id', 'reason')).rejects.toThrow(
        'ReducBox access not found: unknown-id',
      );
    });

    it('should throw when access has no externalAccessId', async () => {
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
        makeAccess({ externalAccessId: null }),
      );

      await expect(service.suspendAccess('access-001', 'reason')).rejects.toThrow('no external access ID');
    });
  });

  // -----------------------------------------------------------------------
  // restoreAccess
  // -----------------------------------------------------------------------
  describe('restoreAccess()', () => {
    beforeEach(() => {
      // Default: access is SUSPENDED for restore tests
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
        makeAccess({ status: ReducBoxAccessStatus.SUSPENDED }),
      );
    });

    it('should call reducBoxPort.restoreAccess with externalAccessId', async () => {
      await service.restoreAccess('access-001');

      expect(mocks.reducBoxPort.restoreAccess).toHaveBeenCalledWith('ext-abc-123');
    });

    it('should update access entity status to ACTIVE', async () => {
      await service.restoreAccess('access-001');

      expect(mocks.reducBoxAccessRepository.update).toHaveBeenCalledTimes(1);
      const updatedEntity = (mocks.reducBoxAccessRepository.update as ReturnType<typeof jest.fn>).mock.calls[0][0];
      expect(updatedEntity.status).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(updatedEntity.restoredAt).toBeInstanceOf(Date);
    });

    it('should record history entry for restoration', async () => {
      await service.restoreAccess('access-001');

      expect(mocks.reducBoxAccessRepository.addHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          accessId: 'access-001',
          previousStatus: ReducBoxAccessStatus.SUSPENDED,
          newStatus: ReducBoxAccessStatus.ACTIVE,
          reason: 'Access restored',
          changedBy: 'system',
        }),
      );
    });

    it('should publish crm.commercial.reducbox.access.restored event', async () => {
      await service.restoreAccess('access-001');

      expect(mocks.publishedEvents.length).toBe(1);
      expect(mocks.publishedEvents[0].subject).toBe('crm.commercial.reducbox.access.restored');

      const payload = mocks.publishedEvents[0].payload as Record<string, unknown>;
      expect(payload.accessId).toBe('access-001');
      expect(payload.previousStatus).toBe(ReducBoxAccessStatus.SUSPENDED);
      expect(payload.status).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(payload.occurredAt).toBeDefined();
    });

    it('should throw when access not found', async () => {
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      await expect(service.restoreAccess('unknown-id')).rejects.toThrow('ReducBox access not found: unknown-id');
    });

    it('should throw when access has no externalAccessId', async () => {
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
        makeAccess({ status: ReducBoxAccessStatus.SUSPENDED, externalAccessId: null }),
      );

      await expect(service.restoreAccess('access-001')).rejects.toThrow('no external access ID');
    });
  });

  // -----------------------------------------------------------------------
  // NATS disconnected — graceful degradation
  // -----------------------------------------------------------------------
  describe('NATS disconnected', () => {
    it('should not fail createAccess when NATS is disconnected', async () => {
      (mocks.natsService.isConnected as ReturnType<typeof jest.fn>).mockReturnValue(false);

      const result = await service.createAccess('client-001', 'contrat-001');

      expect(result.id).toBe('access-001');
      expect(mocks.publishedEvents.length).toBe(0);
    });

    it('should not fail suspendAccess when NATS is disconnected', async () => {
      (mocks.natsService.isConnected as ReturnType<typeof jest.fn>).mockReturnValue(false);

      const result = await service.suspendAccess('access-001', 'Non-payment');

      expect(result.status).toBe(ReducBoxAccessStatus.SUSPENDED);
      expect(mocks.publishedEvents.length).toBe(0);
    });

    it('should not fail restoreAccess when NATS is disconnected', async () => {
      (mocks.natsService.isConnected as ReturnType<typeof jest.fn>).mockReturnValue(false);
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
        makeAccess({ status: ReducBoxAccessStatus.SUSPENDED }),
      );

      const result = await service.restoreAccess('access-001');

      expect(result.status).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(mocks.publishedEvents.length).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Full lifecycle chain
  // -----------------------------------------------------------------------
  describe('Full lifecycle chain', () => {
    it('should support create → suspend → restore flow', async () => {
      // Step 1: Create access
      const created = await service.createAccess('client-001', 'contrat-001');
      expect(created.status).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(mocks.publishedEvents[0].subject).toBe('crm.commercial.reducbox.access.created');

      // Step 2: Suspend access — mock findById returns the created entity
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
        makeAccess({ id: 'access-001', status: ReducBoxAccessStatus.ACTIVE }),
      );
      const suspended = await service.suspendAccess('access-001', 'Non-payment');
      expect(suspended.status).toBe(ReducBoxAccessStatus.SUSPENDED);
      expect(mocks.publishedEvents[1].subject).toBe('crm.commercial.reducbox.access.suspended');

      // Step 3: Restore access — mock findById returns suspended entity
      (mocks.reducBoxAccessRepository.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
        makeAccess({ id: 'access-001', status: ReducBoxAccessStatus.SUSPENDED }),
      );
      const restored = await service.restoreAccess('access-001');
      expect(restored.status).toBe(ReducBoxAccessStatus.ACTIVE);
      expect(mocks.publishedEvents[2].subject).toBe('crm.commercial.reducbox.access.restored');

      // Verify all 3 events published
      expect(mocks.publishedEvents.length).toBe(3);

      // Verify history tracked all transitions
      expect(mocks.reducBoxAccessRepository.addHistory).toHaveBeenCalledTimes(3);
    });
  });
});

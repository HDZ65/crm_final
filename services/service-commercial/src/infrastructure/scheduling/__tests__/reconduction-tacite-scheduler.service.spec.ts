import { beforeEach, describe, expect, it, jest } from 'bun:test';
import type { NatsService } from '@crm/shared-kernel';
import type { IReconductionTaciteRepository } from '../../../domain/contrats/repositories/IReconductionTaciteRepository';
import {
  ReconductionTaciteLogEntity,
  ReconductionTaciteStatus,
} from '../../../domain/contrats/entities/reconduction-tacite-log.entity';
import { ReconductionTaciteSchedulerService } from '../reconduction-tacite-scheduler.service';

function makeReconductionLog(
  overrides: Partial<ReconductionTaciteLogEntity> = {},
): ReconductionTaciteLogEntity {
  const entity = new ReconductionTaciteLogEntity();
  entity.id = overrides.id ?? 'log-1';
  entity.contratId = overrides.contratId ?? 'contrat-1';
  entity.renewalDate = overrides.renewalDate ?? new Date('2026-06-01T00:00:00.000Z');
  entity.notificationJ90Sent = overrides.notificationJ90Sent ?? false;
  entity.notificationJ30Sent = overrides.notificationJ30Sent ?? false;
  entity.notificationJ90DeliveryProofId = overrides.notificationJ90DeliveryProofId ?? null;
  entity.notificationJ30DeliveryProofId = overrides.notificationJ30DeliveryProofId ?? null;
  entity.status = overrides.status ?? ReconductionTaciteStatus.PENDING;
  entity.cancelledAt = overrides.cancelledAt ?? null;
  entity.cancellationReason = overrides.cancellationReason ?? null;
  entity.createdAt = overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z');
  entity.updatedAt = overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z');
  entity.contrat = overrides.contrat ?? ({
    id: entity.contratId,
    clientId: 'client-1',
    organisationId: 'org-1',
    reference: 'CTR-001',
  } as any);
  return entity;
}

function createMocks() {
  const published: Array<{ subject: string; payload: unknown }> = [];

  const repository: IReconductionTaciteRepository = {
    findByContratId: jest.fn(async () => null),
    findContratsDueForJ90: jest.fn(async () => []),
    findContratsDueForJ30: jest.fn(async () => []),
    markJ90Sent: jest.fn(async () => undefined),
    markJ30Sent: jest.fn(async () => undefined),
    markRenewed: jest.fn(async () => undefined),
    markCancelled: jest.fn(async () => undefined),
    create: jest.fn(async (data) => data as ReconductionTaciteLogEntity),
  };

  const natsService = {
    publish: jest.fn(async (subject: string, payload: unknown) => {
      published.push({ subject, payload });
    }),
    subscribe: jest.fn(async () => undefined),
  } as unknown as NatsService;

  return { repository, natsService, published };
}

function createScheduler(mocks: ReturnType<typeof createMocks>) {
  return new ReconductionTaciteSchedulerService(
    mocks.repository,
    mocks.natsService,
  );
}

describe('ReconductionTaciteSchedulerService', () => {
  let mocks: ReturnType<typeof createMocks>;
  let scheduler: ReconductionTaciteSchedulerService;

  beforeEach(() => {
    mocks = createMocks();
    scheduler = createScheduler(mocks);
  });

  it('J-90: publishes events for 2 eligible contracts', async () => {
    const log1 = makeReconductionLog({
      id: 'log-1',
      contratId: 'contrat-1',
      contrat: { id: 'contrat-1', clientId: 'client-A' } as any,
    });
    const log2 = makeReconductionLog({
      id: 'log-2',
      contratId: 'contrat-2',
      contrat: { id: 'contrat-2', clientId: 'client-B' } as any,
    });

    (mocks.repository.findContratsDueForJ90 as ReturnType<typeof jest.fn>).mockResolvedValue([log1, log2]);

    await scheduler.processDueNotifications();

    const j90Events = mocks.published.filter((e) => e.subject === 'crm.reconduction.j90.due');
    expect(j90Events).toHaveLength(2);
    expect((j90Events[0].payload as any).contratId).toBe('contrat-1');
    expect((j90Events[0].payload as any).clientId).toBe('client-A');
    expect((j90Events[1].payload as any).contratId).toBe('contrat-2');
    expect((j90Events[1].payload as any).clientId).toBe('client-B');
    expect(mocks.repository.markJ90Sent).toHaveBeenCalledTimes(2);
  });

  it('J-30: publishes event for 1 eligible contract', async () => {
    const log1 = makeReconductionLog({
      id: 'log-3',
      contratId: 'contrat-3',
      contrat: { id: 'contrat-3', clientId: 'client-C' } as any,
    });

    (mocks.repository.findContratsDueForJ30 as ReturnType<typeof jest.fn>).mockResolvedValue([log1]);

    await scheduler.processDueNotifications();

    const j30Events = mocks.published.filter((e) => e.subject === 'crm.reconduction.j30.due');
    expect(j30Events).toHaveLength(1);
    expect((j30Events[0].payload as any).contratId).toBe('contrat-3');
    expect((j30Events[0].payload as any).clientId).toBe('client-C');
    expect(mocks.repository.markJ30Sent).toHaveBeenCalledTimes(1);
  });

  it('publishes 0 events when no contracts are due (already notified / empty)', async () => {
    // Both return empty arrays (default mocks)
    await scheduler.processDueNotifications();

    expect(mocks.published).toHaveLength(0);
    expect(mocks.natsService.publish).not.toHaveBeenCalled();
    expect(mocks.repository.markJ90Sent).not.toHaveBeenCalled();
    expect(mocks.repository.markJ30Sent).not.toHaveBeenCalled();
  });

  it('idempotency guard: skips processing when already running', async () => {
    // Set private isRunning = true
    (scheduler as any).isRunning = true;

    await scheduler.processDueNotifications();

    expect(mocks.repository.findContratsDueForJ90).not.toHaveBeenCalled();
    expect(mocks.repository.findContratsDueForJ30).not.toHaveBeenCalled();
    expect(mocks.natsService.publish).not.toHaveBeenCalled();
  });

  it('skips contract with missing clientId and does not crash', async () => {
    const logNoClient = makeReconductionLog({
      id: 'log-no-client',
      contratId: 'contrat-orphan',
      contrat: { id: 'contrat-orphan', clientId: undefined } as any,
    });
    const logValid = makeReconductionLog({
      id: 'log-valid',
      contratId: 'contrat-ok',
      contrat: { id: 'contrat-ok', clientId: 'client-OK' } as any,
    });

    (mocks.repository.findContratsDueForJ90 as ReturnType<typeof jest.fn>).mockResolvedValue([
      logNoClient,
      logValid,
    ]);

    await scheduler.processDueNotifications();

    // Only the valid contract should have an event published
    const j90Events = mocks.published.filter((e) => e.subject === 'crm.reconduction.j90.due');
    expect(j90Events).toHaveLength(1);
    expect((j90Events[0].payload as any).contratId).toBe('contrat-ok');
    // markJ90Sent should only be called for the valid contract
    expect(mocks.repository.markJ90Sent).toHaveBeenCalledTimes(1);
  });

  it('resets isRunning flag even when an error occurs', async () => {
    (mocks.repository.findContratsDueForJ90 as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('DB_DOWN'),
    );

    let threw = false;
    try {
      await scheduler.processDueNotifications();
    } catch {
      threw = true;
    }

    expect(threw).toBeTrue();
    // isRunning should be reset to false thanks to finally block
    expect((scheduler as any).isRunning).toBe(false);
  });

  it('publishes renewalDate as ISO string in event payload', async () => {
    const renewalDate = new Date('2026-09-15T00:00:00.000Z');
    const log = makeReconductionLog({
      contratId: 'contrat-date',
      renewalDate,
      contrat: { id: 'contrat-date', clientId: 'client-D' } as any,
    });

    (mocks.repository.findContratsDueForJ90 as ReturnType<typeof jest.fn>).mockResolvedValue([log]);

    await scheduler.processDueNotifications();

    expect(mocks.published).toHaveLength(1);
    expect((mocks.published[0].payload as any).renewalDate).toBe('2026-09-15T00:00:00.000Z');
  });
});

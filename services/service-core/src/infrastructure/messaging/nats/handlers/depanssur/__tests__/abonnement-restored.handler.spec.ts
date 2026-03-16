/**
 * Integration Test — AbonnementRestoredHandler
 *
 * Validates the RG3 reactivation chain:
 *   NATS event (abonnement.depanssur.restored) → handler → find abonnement → update status to ACTIF
 *
 * All external dependencies are mocked (no real DB / NATS).
 */
import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { AbonnementRestoredHandler } from '../abonnement-restored.handler';
import type { NatsService } from '@crm/shared-kernel';
import type { AbonnementService } from '../../../../../persistence/typeorm/repositories/depanssur/abonnement.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AbonnementRestoredEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  restoredAt: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeAbonnement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'abn-001',
    clientId: 'client-001',
    organisationId: 'org-001',
    planType: 'STANDARD',
    statut: 'SUSPENDU_IMPAYE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeEvent(overrides: Partial<AbonnementRestoredEvent> = {}): AbonnementRestoredEvent {
  return {
    abonnementId: 'abn-001',
    clientId: 'client-001',
    organisationId: 'org-001',
    restoredAt: '2026-03-15T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock builders
// ---------------------------------------------------------------------------

function createMocks() {
  const subscriptions: Record<string, (payload: unknown) => Promise<void>> = {};

  const natsService = {
    subscribe: jest.fn(async (subject: string, handler: (payload: unknown) => Promise<void>) => {
      subscriptions[subject] = handler;
    }),
  } as unknown as NatsService;

  const abonnementService = {
    findById: jest.fn(async () => makeAbonnement()),
    update: jest.fn(async () => makeAbonnement({ statut: 'ACTIF' })),
  } as unknown as AbonnementService;

  return { natsService, abonnementService, subscriptions };
}

function createHandler(mocks: ReturnType<typeof createMocks>) {
  return new AbonnementRestoredHandler(mocks.natsService, mocks.abonnementService);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbonnementRestoredHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should subscribe to abonnement.depanssur.restored on module init', async () => {
    const handler = createHandler(mocks);
    await handler.onModuleInit();

    expect(mocks.natsService.subscribe).toHaveBeenCalledTimes(1);
    expect(mocks.natsService.subscribe).toHaveBeenCalledWith(
      'abonnement.depanssur.restored',
      expect.any(Function),
    );
    expect(mocks.subscriptions['abonnement.depanssur.restored']).toBeDefined();
  });

  it('should update abonnement status from SUSPENDU_IMPAYE to ACTIF', async () => {
    const handler = createHandler(mocks);
    await handler.onModuleInit();

    const event = makeEvent();
    await mocks.subscriptions['abonnement.depanssur.restored'](event);

    expect(mocks.abonnementService.findById).toHaveBeenCalledWith('abn-001');
    expect(mocks.abonnementService.update).toHaveBeenCalledWith({
      id: 'abn-001',
      statut: 'ACTIF',
    });
  });

  it('should skip restoration when abonnement is not found', async () => {
    (mocks.abonnementService.findById as ReturnType<typeof jest.fn>).mockResolvedValue(null);

    const handler = createHandler(mocks);
    await handler.onModuleInit();

    const event = makeEvent();
    await mocks.subscriptions['abonnement.depanssur.restored'](event);

    expect(mocks.abonnementService.findById).toHaveBeenCalledWith('abn-001');
    expect(mocks.abonnementService.update).not.toHaveBeenCalled();
  });

  it('should skip restoration when abonnement status is not SUSPENDU_IMPAYE', async () => {
    (mocks.abonnementService.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
      makeAbonnement({ statut: 'ACTIF' }),
    );

    const handler = createHandler(mocks);
    await handler.onModuleInit();

    const event = makeEvent();
    await mocks.subscriptions['abonnement.depanssur.restored'](event);

    expect(mocks.abonnementService.findById).toHaveBeenCalledWith('abn-001');
    expect(mocks.abonnementService.update).not.toHaveBeenCalled();
  });

  it('should skip restoration when abonnement is RESILIE', async () => {
    (mocks.abonnementService.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
      makeAbonnement({ statut: 'RESILIE' }),
    );

    const handler = createHandler(mocks);
    await handler.onModuleInit();

    const event = makeEvent();
    await mocks.subscriptions['abonnement.depanssur.restored'](event);

    expect(mocks.abonnementService.update).not.toHaveBeenCalled();
  });

  it('should propagate error when abonnement service throws', async () => {
    (mocks.abonnementService.findById as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('DB_CONNECTION_LOST'),
    );

    const handler = createHandler(mocks);
    await handler.onModuleInit();

    const event = makeEvent();
    await expect(
      mocks.subscriptions['abonnement.depanssur.restored'](event),
    ).rejects.toThrow('DB_CONNECTION_LOST');
  });

  it('should propagate error when update fails', async () => {
    (mocks.abonnementService.update as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('UPDATE_FAILED'),
    );

    const handler = createHandler(mocks);
    await handler.onModuleInit();

    const event = makeEvent();
    await expect(
      mocks.subscriptions['abonnement.depanssur.restored'](event),
    ).rejects.toThrow('UPDATE_FAILED');
  });

  it('should handle full event chain: subscribe → receive → find → update', async () => {
    const handler = createHandler(mocks);
    await handler.onModuleInit();

    // Simulate NATS delivering the event
    const event = makeEvent({
      abonnementId: 'abn-999',
      clientId: 'client-999',
      organisationId: 'org-999',
      restoredAt: '2026-03-16T14:30:00.000Z',
    });

    (mocks.abonnementService.findById as ReturnType<typeof jest.fn>).mockResolvedValue(
      makeAbonnement({ id: 'abn-999', statut: 'SUSPENDU_IMPAYE' }),
    );

    await mocks.subscriptions['abonnement.depanssur.restored'](event);

    expect(mocks.abonnementService.findById).toHaveBeenCalledWith('abn-999');
    expect(mocks.abonnementService.update).toHaveBeenCalledWith({
      id: 'abn-999',
      statut: 'ACTIF',
    });
  });
});

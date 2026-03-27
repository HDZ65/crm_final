import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import { ContratStatus } from '../../entities/contrat-status.enum';
import { ContratLifecycleService } from '../contrat-lifecycle.service';

function makeContrat(statut: ContratStatus) {
  return {
    id: 'contrat-1',
    statut,
  } as any;
}

describe('ContratLifecycleService integration lifecycle chains', () => {
  const mockRepo = {
    findById: jest.fn(),
    save: jest.fn().mockImplementation(async (entity) => entity),
  };

  const mockHistoryService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockPublisher = {
    publishStatusChanged: jest.fn().mockResolvedValue(undefined),
  };

  const lifecycleService = new ContratLifecycleService(
    mockRepo as any,
    mockHistoryService as any,
    mockPublisher as any,
  );

  beforeEach(() => {
    mockRepo.findById.mockReset();
    mockRepo.save.mockClear();
    mockHistoryService.create.mockClear();
    mockPublisher.publishStatusChanged.mockClear();
  });

  it('runs DRAFT -> ACTIVE -> SUSPENDED -> ACTIVE restore flow', async () => {
    const contrat = makeContrat(ContratStatus.DRAFT);
    mockRepo.findById.mockResolvedValue(contrat);

    await lifecycleService.activate('contrat-1', { triggeredBy: 'user-1', reason: 'validated' });

    mockRepo.findById.mockResolvedValue(contrat);
    await lifecycleService.suspend('contrat-1', { triggeredBy: 'system-dunning', reason: 'impaye' });

    mockRepo.findById.mockResolvedValue(contrat);
    const restored = await lifecycleService.activate('contrat-1', {
      triggeredBy: 'system-payment',
      reason: 'payment_received',
    });

    expect(restored.statut).toBe(ContratStatus.ACTIVE);
    expect(mockHistoryService.create).toHaveBeenCalledTimes(3);
  });

  it('runs DRAFT -> ACTIVE -> TERMINATED for client resignation', async () => {
    const contrat = makeContrat(ContratStatus.DRAFT);
    mockRepo.findById.mockResolvedValue(contrat);

    await lifecycleService.activate('contrat-1', { triggeredBy: 'user-1', reason: 'validated' });

    mockRepo.findById.mockResolvedValue(contrat);
    const terminated = await lifecycleService.terminate('contrat-1', {
      triggeredBy: 'user-1',
      reason: 'client_resignation',
    });

    expect(terminated.statut).toBe(ContratStatus.TERMINATED);
    expect(mockHistoryService.create).toHaveBeenCalledTimes(2);
    expect(mockPublisher.publishStatusChanged).toHaveBeenCalledTimes(2);
  });

  it('runs DRAFT -> ACTIVE -> CLOSED natural end flow', async () => {
    const contrat = makeContrat(ContratStatus.DRAFT);
    mockRepo.findById.mockResolvedValue(contrat);

    await lifecycleService.activate('contrat-1', { triggeredBy: 'scheduler', reason: 'validated' });

    mockRepo.findById.mockResolvedValue(contrat);
    const closed = await lifecycleService.close('contrat-1', { triggeredBy: 'scheduler' });

    expect(closed.statut).toBe(ContratStatus.CLOSED);
  });

  it('runs DRAFT -> TERMINATED cancellation before activation', async () => {
    const contrat = makeContrat(ContratStatus.DRAFT);
    mockRepo.findById.mockResolvedValue(contrat);

    const terminated = await lifecycleService.terminate('contrat-1', {
      triggeredBy: 'user-1',
      reason: 'cancel_before_activation',
    });

    expect(terminated.statut).toBe(ContratStatus.TERMINATED);
    expect(mockHistoryService.create).toHaveBeenCalledTimes(1);
  });

  it('runs ACTIVE -> SUSPENDED -> TERMINATED unpaid to resignation flow', async () => {
    const contrat = makeContrat(ContratStatus.ACTIVE);
    mockRepo.findById.mockResolvedValue(contrat);

    await lifecycleService.suspend('contrat-1', {
      triggeredBy: 'system-dunning',
      reason: 'max_retries_exceeded',
    });

    mockRepo.findById.mockResolvedValue(contrat);
    const terminated = await lifecycleService.terminate('contrat-1', {
      triggeredBy: 'user-1',
      reason: 'resignation_after_suspension',
    });

    expect(terminated.statut).toBe(ContratStatus.TERMINATED);
    expect(mockHistoryService.create).toHaveBeenCalledTimes(2);
  });

  it('creates history entries with expected ancienStatut/nouveauStatut chain values', async () => {
    const contrat = makeContrat(ContratStatus.DRAFT);
    mockRepo.findById.mockResolvedValue(contrat);

    await lifecycleService.activate('contrat-1', { triggeredBy: 'user-1', reason: 'validated' });

    mockRepo.findById.mockResolvedValue(contrat);
    await lifecycleService.suspend('contrat-1', { triggeredBy: 'system-dunning', reason: 'impaye' });

    expect(mockHistoryService.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        contratId: 'contrat-1',
        ancienStatut: ContratStatus.DRAFT,
        nouveauStatut: ContratStatus.ACTIVE,
      }),
    );
    expect(mockHistoryService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        contratId: 'contrat-1',
        ancienStatut: ContratStatus.ACTIVE,
        nouveauStatut: ContratStatus.SUSPENDED,
      }),
    );
  });

  it('publishes NATS event with previousStatus/newStatus on transition', async () => {
    const contrat = makeContrat(ContratStatus.DRAFT);
    mockRepo.findById.mockResolvedValue(contrat);

    await lifecycleService.activate('contrat-1', {
      triggeredBy: 'user-1',
      reason: 'validated',
    });

    expect(mockPublisher.publishStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        contratId: 'contrat-1',
        previousStatus: ContratStatus.DRAFT,
        newStatus: ContratStatus.ACTIVE,
      }),
    );
  });

  it('rejects invalid CLOSED -> ACTIVE transition and skips persistence side-effects', async () => {
    const contrat = makeContrat(ContratStatus.CLOSED);
    mockRepo.findById.mockResolvedValue(contrat);

    await expect(
      lifecycleService.activate('contrat-1', {
        triggeredBy: 'user-1',
        reason: 'force_reactivate',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_INVALID_STATUS_TRANSITION',
    } as Partial<DomainException>);

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(mockHistoryService.create).not.toHaveBeenCalled();
  });
});

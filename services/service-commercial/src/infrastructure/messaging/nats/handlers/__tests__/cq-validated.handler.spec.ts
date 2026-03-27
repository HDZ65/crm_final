import { beforeEach, describe, expect, it, jest } from 'bun:test';
import type { Repository } from 'typeorm';
import type { NatsService } from '@crm/shared-kernel';
import type { ContratEntity } from '../../../../../domain/contrats/entities/contrat.entity';
import type { ControleQualiteEntity } from '../../../../../domain/qualite/entities/controle-qualite.entity';
import { StatutCQ } from '../../../../../domain/qualite/enums/statut-cq.enum';
import { CQValidatedHandler } from '../cq-validated.handler';

// --- Factories -----------------------------------------------------------

function makeControle(overrides: Partial<ControleQualiteEntity> = {}): ControleQualiteEntity {
  return {
    id: 'cq-1',
    organisationId: 'org-1',
    contratId: 'contrat-1',
    statut: StatutCQ.EN_ATTENTE,
    validateurId: null,
    score: null,
    dateSoumission: new Date('2026-03-01'),
    dateValidation: null,
    motifRejet: null,
    commentaire: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resultats: [],
    ...overrides,
  } as ControleQualiteEntity;
}

// --- Mock builders -------------------------------------------------------

function createMocks() {
  const subscriptions: Record<string, (payload: unknown) => Promise<void>> = {};

  const natsService = {
    publish: jest.fn(async () => undefined),
    subscribe: jest.fn(async (subject: string, handler: (payload: unknown) => Promise<void>) => {
      subscriptions[subject] = handler;
    }),
  } as unknown as NatsService;

  const contratRepository = {
    update: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<ContratEntity>;

  const cqRepository = {
    findOne: jest.fn(async () => makeControle()),
    save: jest.fn(async (entity: Partial<ControleQualiteEntity>) => ({
      ...makeControle(),
      ...entity,
    })),
  } as unknown as Repository<ControleQualiteEntity>;

  return { natsService, contratRepository, cqRepository, subscriptions };
}

function createHandler(mocks: ReturnType<typeof createMocks>) {
  return new CQValidatedHandler(mocks.natsService, mocks.contratRepository, mocks.cqRepository);
}

async function initAndGetSubscriptions(mocks: ReturnType<typeof createMocks>) {
  const handler = createHandler(mocks);
  await handler.onModuleInit();
  return { handler, subscriptions: mocks.subscriptions };
}

// --- Tests ---------------------------------------------------------------

describe('CQValidatedHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('subscribes to contrat.cq.validated on init', async () => {
    await initAndGetSubscriptions(mocks);

    expect(mocks.natsService.subscribe).toHaveBeenCalledTimes(1);
    const subscribeArgs = (mocks.natsService.subscribe as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(subscribeArgs[0]).toBe('contrat.cq.validated');
  });

  it('updates contrat.statutCq to VALIDE', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['contrat.cq.validated']({
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      validateur_id: 'user-1',
      score: 95,
      timestamp: '2026-03-16T10:00:00.000Z',
    });

    expect(mocks.contratRepository.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mocks.contratRepository.update as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(updateArgs[0]).toEqual({ id: 'contrat-1' });
    expect(updateArgs[1]).toEqual({ statutCq: StatutCQ.VALIDE });
  });

  it('updates ControleQualite record with VALIDE status, score, and validateurId', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['contrat.cq.validated']({
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      validateur_id: 'user-1',
      score: 95,
      timestamp: '2026-03-16T10:00:00.000Z',
    });

    expect(mocks.cqRepository.findOne).toHaveBeenCalledTimes(1);
    expect(mocks.cqRepository.save).toHaveBeenCalledTimes(1);

    const savedEntity = (mocks.cqRepository.save as ReturnType<typeof jest.fn>).mock.calls[0][0];
    expect(savedEntity.statut).toBe(StatutCQ.VALIDE);
    expect(savedEntity.validateurId).toBe('user-1');
    expect(savedEntity.score).toBe(95);
    expect(savedEntity.dateValidation).toBeInstanceOf(Date);
  });

  it('skips when contrat_id is missing', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['contrat.cq.validated']({
      contrat_id: '',
      organisation_id: 'org-1',
      validateur_id: 'user-1',
      score: 95,
      timestamp: '2026-03-16T10:00:00.000Z',
    });

    expect(mocks.contratRepository.update).not.toHaveBeenCalled();
    expect(mocks.cqRepository.save).not.toHaveBeenCalled();
  });

  it('handles missing ControleQualite record gracefully', async () => {
    (mocks.cqRepository.findOne as ReturnType<typeof jest.fn>).mockResolvedValue(null);
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['contrat.cq.validated']({
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      validateur_id: 'user-1',
      score: 95,
      timestamp: '2026-03-16T10:00:00.000Z',
    });

    // Contrat still updated
    expect(mocks.contratRepository.update).toHaveBeenCalledTimes(1);
    // CQ save NOT called (no controle found)
    expect(mocks.cqRepository.save).not.toHaveBeenCalled();
  });

  it('does not throw on repository error (error path)', async () => {
    (mocks.contratRepository.update as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('DB_FAILURE'),
    );
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    // Should not throw — handler catches errors internally
    await subscriptions['contrat.cq.validated']({
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      validateur_id: 'user-1',
      score: 95,
      timestamp: '2026-03-16T10:00:00.000Z',
    });

    expect(mocks.contratRepository.update).toHaveBeenCalledTimes(1);
  });

  it('handles null validateur_id and undefined score', async () => {
    const { subscriptions } = await initAndGetSubscriptions(mocks);

    await subscriptions['contrat.cq.validated']({
      contrat_id: 'contrat-1',
      organisation_id: 'org-1',
      validateur_id: '',
      score: undefined,
      timestamp: '2026-03-16T10:00:00.000Z',
    });

    expect(mocks.cqRepository.save).toHaveBeenCalledTimes(1);
    const savedEntity = (mocks.cqRepository.save as ReturnType<typeof jest.fn>).mock.calls[0][0];
    expect(savedEntity.validateurId).toBe(null); // '' || null → null
    expect(savedEntity.score).toBeNull(); // undefined ?? null → null
  });
});

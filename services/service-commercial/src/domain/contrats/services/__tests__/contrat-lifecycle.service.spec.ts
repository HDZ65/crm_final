import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import { ContratEntity } from '../../entities/contrat.entity';
import { ContratStatus } from '../../entities/contrat-status.enum';
import type { IContratRepository } from '../../repositories/IContratRepository';
import {
  ContratLifecycleService,
  type ContratHistoryService,
  type ContratNatsPublisher,
} from '../contrat-lifecycle.service';

function makeContrat(overrides: Partial<ContratEntity> = {}): ContratEntity {
  return {
    id: 'contrat-1',
    organisationId: 'org-1',
    reference: 'CTR-001',
    titre: 'Contrat test',
    description: null,
    type: null,
    statut: ContratStatus.DRAFT,
    dateDebut: '2026-01-01',
    dateFin: null,
    dateSignature: null,
    montant: 1000,
    devise: 'EUR',
    frequenceFacturation: 'MONTHLY',
    documentUrl: null,
    fournisseur: null,
    clientId: 'client-1',
    commercialId: 'commercial-1',
    societeId: null,
    notes: null,
    createdBy: 'system',
    modifiedBy: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    renewalDate: null,
    taciteRenewalEnabled: false,
    renewalStatus: null,
    renewalNotificationJ90SentAt: null,
    renewalNotificationJ30SentAt: null,
    renewalCancellationDeadline: null,
    lignes: [],
    historique: [],
    ...overrides,
  };
}

function createFixture(initialStatus: ContratStatus | null) {
  let contrat = initialStatus ? makeContrat({ statut: initialStatus }) : null;
  const savedEntities: ContratEntity[] = [];
  const historyEntries: Array<{
    contratId: string;
    ancienStatut: string;
    nouveauStatut: string;
    dateChangement: string;
  }> = [];
  const publishedEvents: Array<{
    contratId: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    triggeredBy: string;
  }> = [];

  const repository = {
    findById: async (id: string) => {
      if (!contrat || contrat.id !== id) {
        return null;
      }
      return { ...contrat };
    },
    save: async (entity: ContratEntity) => {
      contrat = { ...entity };
      savedEntities.push({ ...entity });
      return { ...entity };
    },
  } as unknown as IContratRepository;

  const historyService: ContratHistoryService = {
    create: async (entry) => {
      historyEntries.push(entry);
    },
  };

  const publisher: ContratNatsPublisher = {
    publishStatusChanged: async (event) => {
      publishedEvents.push(event);
    },
  };

  const service = new ContratLifecycleService(repository, historyService, publisher);

  return {
    service,
    savedEntities,
    historyEntries,
    publishedEvents,
  };
}

describe('ContratLifecycleService', () => {
  it('transitions DRAFT -> ACTIVE via activate()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.DRAFT,
    );

    const updated = await service.activate('contrat-1', {
      triggeredBy: 'user-1',
      reason: 'validated',
    });

    expect(updated.statut).toBe(ContratStatus.ACTIVE);
    expect(savedEntities[0].statut).toBe(ContratStatus.ACTIVE);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.DRAFT);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.ACTIVE);
    expect(historyEntries[0].dateChangement).toBeTruthy();
    expect(publishedEvents[0].previousStatus).toBe(ContratStatus.DRAFT);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.ACTIVE);
  });

  it('transitions DRAFT -> TERMINATED via terminate()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.DRAFT,
    );

    const updated = await service.terminate('contrat-1', {
      triggeredBy: 'user-1',
      reason: 'client_cancelled',
    });

    expect(updated.statut).toBe(ContratStatus.TERMINATED);
    expect(savedEntities[0].statut).toBe(ContratStatus.TERMINATED);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.DRAFT);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.TERMINATED);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.TERMINATED);
  });

  it('transitions ACTIVE -> SUSPENDED via suspend()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.ACTIVE,
    );

    const updated = await service.suspend('contrat-1', {
      triggeredBy: 'admin-1',
      reason: 'payment_issue',
    });

    expect(updated.statut).toBe(ContratStatus.SUSPENDED);
    expect(savedEntities[0].statut).toBe(ContratStatus.SUSPENDED);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.ACTIVE);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.SUSPENDED);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.SUSPENDED);
  });

  it('transitions ACTIVE -> TERMINATED via terminate()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.ACTIVE,
    );

    const updated = await service.terminate('contrat-1', {
      triggeredBy: 'admin-1',
      reason: 'termination',
    });

    expect(updated.statut).toBe(ContratStatus.TERMINATED);
    expect(savedEntities[0].statut).toBe(ContratStatus.TERMINATED);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.ACTIVE);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.TERMINATED);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.TERMINATED);
  });

  it('transitions ACTIVE -> CLOSED via close()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.ACTIVE,
    );

    const updated = await service.close('contrat-1', {
      triggeredBy: 'admin-1',
    });

    expect(updated.statut).toBe(ContratStatus.CLOSED);
    expect(savedEntities[0].statut).toBe(ContratStatus.CLOSED);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.ACTIVE);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.CLOSED);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.CLOSED);
  });

  it('transitions SUSPENDED -> ACTIVE via activate()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.SUSPENDED,
    );

    const updated = await service.activate('contrat-1', {
      triggeredBy: 'admin-1',
      reason: 'recovered',
    });

    expect(updated.statut).toBe(ContratStatus.ACTIVE);
    expect(savedEntities[0].statut).toBe(ContratStatus.ACTIVE);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.SUSPENDED);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.ACTIVE);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.ACTIVE);
  });

  it('transitions SUSPENDED -> TERMINATED via terminate()', async () => {
    const { service, savedEntities, historyEntries, publishedEvents } = createFixture(
      ContratStatus.SUSPENDED,
    );

    const updated = await service.terminate('contrat-1', {
      triggeredBy: 'admin-1',
      reason: 'manual_termination',
    });

    expect(updated.statut).toBe(ContratStatus.TERMINATED);
    expect(savedEntities[0].statut).toBe(ContratStatus.TERMINATED);
    expect(historyEntries[0].ancienStatut).toBe(ContratStatus.SUSPENDED);
    expect(historyEntries[0].nouveauStatut).toBe(ContratStatus.TERMINATED);
    expect(publishedEvents[0].newStatus).toBe(ContratStatus.TERMINATED);
  });

  it('rejects TERMINATED -> ACTIVE', async () => {
    const { service, savedEntities, historyEntries } = createFixture(ContratStatus.TERMINATED);

    await expect(
      service.activate('contrat-1', {
        triggeredBy: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_INVALID_STATUS_TRANSITION',
    } as Partial<DomainException>);

    expect(savedEntities.length).toBe(0);
    expect(historyEntries.length).toBe(0);
  });

  it('rejects CLOSED -> ACTIVE', async () => {
    const { service, savedEntities, historyEntries } = createFixture(ContratStatus.CLOSED);

    await expect(
      service.activate('contrat-1', {
        triggeredBy: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_INVALID_STATUS_TRANSITION',
    } as Partial<DomainException>);

    expect(savedEntities.length).toBe(0);
    expect(historyEntries.length).toBe(0);
  });

  it('rejects DRAFT -> SUSPENDED', async () => {
    const { service, savedEntities, historyEntries } = createFixture(ContratStatus.DRAFT);

    await expect(
      service.suspend('contrat-1', {
        triggeredBy: 'user-1',
        reason: 'suspend_attempt',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_INVALID_STATUS_TRANSITION',
    } as Partial<DomainException>);

    expect(savedEntities.length).toBe(0);
    expect(historyEntries.length).toBe(0);
  });

  it('rejects CLOSED -> TERMINATED', async () => {
    const { service, savedEntities, historyEntries } = createFixture(ContratStatus.CLOSED);

    await expect(
      service.terminate('contrat-1', {
        triggeredBy: 'user-1',
        reason: 'force_to_draft',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_INVALID_STATUS_TRANSITION',
    } as Partial<DomainException>);

    expect(savedEntities.length).toBe(0);
    expect(historyEntries.length).toBe(0);
  });

  it('rejects TERMINATED -> CLOSED', async () => {
    const { service, savedEntities, historyEntries } = createFixture(ContratStatus.TERMINATED);

    await expect(
      service.close('contrat-1', {
        triggeredBy: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_INVALID_STATUS_TRANSITION',
    } as Partial<DomainException>);

    expect(savedEntities.length).toBe(0);
    expect(historyEntries.length).toBe(0);
  });

  it('throws CONTRAT_NOT_FOUND when contrat does not exist', async () => {
    const { service, savedEntities, historyEntries } = createFixture(null);

    await expect(
      service.activate('contrat-1', {
        triggeredBy: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'CONTRAT_NOT_FOUND',
    } as Partial<DomainException>);

    expect(savedEntities.length).toBe(0);
    expect(historyEntries.length).toBe(0);
  });
});

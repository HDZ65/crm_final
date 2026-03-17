import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import type { FindOneOptions, Repository } from 'typeorm';
import { ContratStatus } from '../../entities/contrat-status.enum';
import { HistoriqueStatutContratEntity } from '../../entities/historique-statut-contrat.entity';
import { StatutContratEntity } from '../../entities/statut-contrat.entity';
import { ContratHistoryService } from '../contrat-history.service';

type StatutRepoMock = Pick<Repository<StatutContratEntity>, 'findOne'>;
type HistoryRepoMock = Pick<Repository<HistoriqueStatutContratEntity>, 'save' | 'find'>;

function makeFixture(statusByCode: Record<string, string>) {
  const findOneCalls: Array<FindOneOptions<StatutContratEntity>> = [];
  const saveCalls: HistoriqueStatutContratEntity[] = [];
  const findCalls: Array<Record<string, unknown>> = [];

  const statutRepo: StatutRepoMock = {
    findOne: async (options: FindOneOptions<StatutContratEntity>) => {
      findOneCalls.push(options);
      const code = options.where && 'code' in options.where ? options.where.code : undefined;
      if (!code || typeof code !== 'string' || !statusByCode[code]) {
        return null;
      }

      const entity = new StatutContratEntity();
      entity.id = statusByCode[code];
      entity.code = code;
      entity.nom = code;
      entity.description = null;
      entity.ordreAffichage = 0;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      return entity;
    },
  };

  const historyList: HistoriqueStatutContratEntity[] = [];
  const historyRepo: HistoryRepoMock = {
    save: async (entity: HistoriqueStatutContratEntity) => {
      saveCalls.push(entity);
      const saved = Object.assign(new HistoriqueStatutContratEntity(), entity, {
        id: entity.id ?? 'history-id-1',
      });
      return saved;
    },
    find: async (options: Record<string, unknown>) => {
      findCalls.push(options);
      return historyList;
    },
  };

  const service = new ContratHistoryService(
    statutRepo as Repository<StatutContratEntity>,
    historyRepo as Repository<HistoriqueStatutContratEntity>,
  );

  return {
    service,
    findOneCalls,
    saveCalls,
    findCalls,
    historyList,
  };
}

describe('ContratHistoryService', () => {
  it('create resolves status codes to UUIDs and saves history entry', async () => {
    const fixture = makeFixture({
      DRAFT: '11111111-1111-1111-1111-111111111111',
      ACTIVE: '22222222-2222-2222-2222-222222222222',
    });

    const result = await fixture.service.create({
      contratId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ancienStatut: ContratStatus.DRAFT,
      nouveauStatut: ContratStatus.ACTIVE,
      dateChangement: '2026-01-10T08:00:00.000Z',
    });

    expect(fixture.saveCalls).toHaveLength(1);
    expect(fixture.saveCalls[0].contratId).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(fixture.saveCalls[0].ancienStatutId).toBe('11111111-1111-1111-1111-111111111111');
    expect(fixture.saveCalls[0].nouveauStatutId).toBe('22222222-2222-2222-2222-222222222222');
    expect(fixture.saveCalls[0].dateChangement).toBe('2026-01-10T08:00:00.000Z');
    expect(result.ancienStatutId).toBe('11111111-1111-1111-1111-111111111111');
    expect(result.nouveauStatutId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('create uses in-memory cache and avoids duplicate status lookups', async () => {
    const fixture = makeFixture({
      DRAFT: '11111111-1111-1111-1111-111111111111',
      ACTIVE: '22222222-2222-2222-2222-222222222222',
    });

    await fixture.service.create({
      contratId: 'contrat-1',
      ancienStatut: ContratStatus.DRAFT,
      nouveauStatut: ContratStatus.ACTIVE,
      dateChangement: '2026-01-01',
    });

    await fixture.service.create({
      contratId: 'contrat-1',
      ancienStatut: ContratStatus.DRAFT,
      nouveauStatut: ContratStatus.ACTIVE,
      dateChangement: '2026-01-02',
    });

    expect(fixture.findOneCalls).toHaveLength(2);
  });

  it('create throws DomainException when a status code cannot be resolved', async () => {
    const fixture = makeFixture({
      DRAFT: '11111111-1111-1111-1111-111111111111',
    });

    await expect(
      fixture.service.create({
        contratId: 'contrat-1',
        ancienStatut: ContratStatus.DRAFT,
        nouveauStatut: 'UNKNOWN' as ContratStatus,
        dateChangement: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(DomainException);

    await fixture.service
      .create({
        contratId: 'contrat-1',
        ancienStatut: ContratStatus.DRAFT,
        nouveauStatut: 'UNKNOWN' as ContratStatus,
        dateChangement: '2026-01-01',
      })
      .catch((error: DomainException) => {
        expect(error.code).toBe('STATUT_CONTRAT_NOT_FOUND');
      });
  });

  it('findByContrat returns history ordered by dateChangement DESC', async () => {
    const fixture = makeFixture({});
    const first = new HistoriqueStatutContratEntity();
    first.id = 'history-1';
    first.dateChangement = '2026-01-02T10:00:00.000Z';

    const second = new HistoriqueStatutContratEntity();
    second.id = 'history-2';
    second.dateChangement = '2026-01-01T10:00:00.000Z';

    fixture.historyList.push(first, second);

    const result = await fixture.service.findByContrat('contrat-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('history-1');
    expect(result[1].id).toBe('history-2');
    expect(fixture.findCalls).toHaveLength(1);
    expect(fixture.findCalls[0]).toEqual({
      where: { contratId: 'contrat-1' },
      order: { dateChangement: 'DESC' },
    });
  });
});

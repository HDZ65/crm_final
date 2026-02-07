import { describe, expect, it } from 'bun:test';
import { createMockBareme, createMockContrat } from './helpers/calculation-helpers';
import { expectDecimalEqual } from './helpers/decimal-helpers';
import {
  RecurrenceGenerationService,
  type RecurrenceDependencies,
} from '../recurrence-generation.service';

function createService(overrides: Partial<RecurrenceDependencies> = {}) {
  const deps: RecurrenceDependencies = {
    findContratById: async (contratId: string) =>
      createMockContrat({ id: contratId, statut: 'VALIDE', dateFin: null, montantHT: 1200 }),
    findBaremeAtDate: async () =>
      createMockBareme({
        id: 'bareme-v2',
        version: 2,
        recurrenceActive: true,
        tauxRecurrence: 3,
        dureeRecurrenceMois: 12,
      }),
    isEcheanceReglee: async () => true,
    getRecurrenceMonthNumber: async () => 3,
    persistRecurrence: async () => undefined,
    suspendRecurrences: async () => undefined,
    ...overrides,
  };

  return new RecurrenceGenerationService(deps);
}

describe('RecurrenceGenerationService', () => {
  it('echeance reglee: creation ligne recurrente', async () => {
    const service = createService();
    const result = await service.genererRecurrence('contrat-1', 'ech-1', '2026-03-10');

    expect(result.creee).toBe(true);
    expect(result.recurrence?.baremeVersion).toBe(2);
  });

  it('echeance echeue non reglee: aucune ligne', async () => {
    const service = createService({ isEcheanceReglee: async () => false });
    const result = await service.genererRecurrence('contrat-1', 'ech-2', '2026-03-10');

    expect(result.creee).toBe(false);
    expect(result.raison).toBe('ECHEANCE_NON_REGLEE');
  });

  it('contrat resilie: aucune recurrence post-resiliation', async () => {
    const service = createService({
      findContratById: async (contratId: string) =>
        createMockContrat({
          id: contratId,
          statut: 'RESILIE',
          dateFin: new Date('2026-01-31'),
          montantHT: 1200,
        }),
    });

    const result = await service.genererRecurrence('contrat-resilie', 'ech-1', '2026-03-10');
    expect(result.creee).toBe(false);
    expect(result.raison).toBe('CONTRAT_RESILIE');
  });

  it('duree max atteinte (mois > dureeRecurrenceMois): stop', async () => {
    const service = createService({ getRecurrenceMonthNumber: async () => 13 });

    const result = await service.genererRecurrence('contrat-1', 'ech-1', '2026-03-10');
    expect(result.creee).toBe(false);
    expect(result.raison).toBe('DUREE_MAX_ATTEINTE');
  });

  it('duree illimitee (null): continue', async () => {
    const service = createService({
      findBaremeAtDate: async () =>
        createMockBareme({
          id: 'bareme-v3',
          version: 3,
          recurrenceActive: true,
          tauxRecurrence: 2.5,
          dureeRecurrenceMois: null,
        }),
      getRecurrenceMonthNumber: async () => 48,
    });

    const result = await service.genererRecurrence('contrat-1', 'ech-1', '2026-03-10');
    expect(result.creee).toBe(true);
    expect(result.recurrence?.numeroMois).toBe(48);
  });

  it('changement bareme: utilise version en vigueur a date encaissement (non retroactif)', async () => {
    const service = createService({
      findBaremeAtDate: async (_contratId: string, dateEncaissement: Date) => {
        if (dateEncaissement < new Date('2026-02-01')) {
          return createMockBareme({ id: 'bareme-v1', version: 1, tauxRecurrence: 2.2, recurrenceActive: true });
        }

        return createMockBareme({ id: 'bareme-v2', version: 2, tauxRecurrence: 3.4, recurrenceActive: true });
      },
    });

    const janvier = await service.genererRecurrence('contrat-1', 'ech-jan', '2026-01-15');
    const mars = await service.genererRecurrence('contrat-1', 'ech-mar', '2026-03-15');

    expect(janvier.recurrence?.baremeVersion).toBe(1);
    expect(mars.recurrence?.baremeVersion).toBe(2);
  });

  it('formule recurrence: round(base x (taux / 100), 2)', async () => {
    const service = createService({
      findContratById: async (contratId: string) =>
        createMockContrat({ id: contratId, statut: 'VALIDE', montantHT: 1000.01 }),
      findBaremeAtDate: async () =>
        createMockBareme({
          id: 'bareme-v4',
          version: 4,
          recurrenceActive: true,
          tauxRecurrence: 3,
          dureeRecurrenceMois: 24,
        }),
    });

    const result = await service.genererRecurrence('contrat-1', 'ech-1', '2026-03-10');
    expectDecimalEqual(result.recurrence?.montantCalcule ?? 0, 30);
  });
});

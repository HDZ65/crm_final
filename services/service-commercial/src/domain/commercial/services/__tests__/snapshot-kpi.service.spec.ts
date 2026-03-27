import { describe, expect, it } from 'bun:test';
import {
  SnapshotKpiService,
  type DashboardKpiFilters,
  type SnapshotKpiDependencies,
} from '../snapshot-kpi.service';
import { expectDecimalEqual } from './helpers/decimal-helpers';

function createDeps(overrides: Partial<SnapshotKpiDependencies> = {}): SnapshotKpiDependencies {
  return {
    aggregateBrutNetReprises: async () => ({
      totalBrut: 1000,
      totalNet: 800,
      totalReprises: 200,
      volume: 5,
    }),
    aggregateRecurrence: async () => ({
      totalRecurrence: 120,
    }),
    aggregateValidationDelaiDays: async () => ({
      moyenneJours: 3,
    }),
    aggregateParProduit: async () => ([
      { produitId: 'prod-a', totalBrut: 700, totalNet: 560, totalReprises: 140, volume: 3 },
      { produitId: 'prod-b', totalBrut: 300, totalNet: 240, totalReprises: 60, volume: 2 },
    ]),
    findLatestSnapshot: async () => null,
    findSnapshotByPeriode: async () => null,
    saveSnapshot: async () => ({ id: 'snapshot-1', createdAt: new Date('2026-02-01T00:00:00.000Z') }),
    ...overrides,
  };
}

const filters: DashboardKpiFilters = {
  organisationId: 'org-1',
  periode: '2026-01',
};

describe('SnapshotKpiService', () => {
  it('calcule un snapshot KPI complet avec formules CDC', async () => {
    const service = new SnapshotKpiService(createDeps());

    const snapshot = await service.genererSnapshot(filters, 'manual', 'user-1');

    expectDecimalEqual(snapshot.totalBrut, 1000);
    expectDecimalEqual(snapshot.totalNet, 800);
    expectDecimalEqual(snapshot.totalReprises, 200);
    expectDecimalEqual(snapshot.totalRecurrence, 120);
    expectDecimalEqual(snapshot.tauxReprise, 20);
    expect(snapshot.volume).toBe(5);
    expectDecimalEqual(snapshot.delaiValidationMoyenJours, 3);
  });

  it('retourne les KPIs dashboard depuis le dernier snapshot quand disponible', async () => {
    const service = new SnapshotKpiService(createDeps({
      findSnapshotByPeriode: async () => ({
        id: 'snapshot-latest',
        organisationId: 'org-1',
        periode: '2026-01',
        generatedAt: new Date('2026-02-01T00:00:00.000Z'),
        source: 'manual',
        generatedBy: 'user-1',
        kpiJson: {
          totalBrut: 1500,
          totalNet: 1300,
          totalReprises: 200,
          totalRecurrence: 100,
          tauxReprise: 13.33,
          volume: 9,
          delaiValidationMoyenJours: 2,
          parProduit: [],
        },
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    }));

    const dashboard = await service.getDashboardKpi(filters);

    expectDecimalEqual(dashboard.totalBrut, 1500);
    expect(dashboard.volume).toBe(9);
    expect(dashboard.periode).toBe('2026-01');
  });

  it('calcule les comparatifs M-1, M-3, M-12', async () => {
    const service = new SnapshotKpiService(createDeps({
      findSnapshotByPeriode: async (input) => {
        const totals: Record<string, number> = {
          '2025-12': 900,
          '2025-10': 750,
          '2025-01': 500,
        };
        if (!totals[input.periode]) return null;
        return {
          id: `snapshot-${input.periode}`,
          organisationId: input.organisationId,
          periode: input.periode,
          generatedAt: new Date('2026-02-01T00:00:00.000Z'),
          source: 'manual',
          generatedBy: null,
          kpiJson: {
            totalBrut: totals[input.periode],
            totalNet: totals[input.periode],
            totalReprises: 0,
            totalRecurrence: 0,
            tauxReprise: 0,
            volume: 1,
            delaiValidationMoyenJours: 1,
            parProduit: [],
          },
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        };
      },
    }));

    const comparatifs = await service.getComparatifs({ ...filters, periode: '2026-01' });

    expectDecimalEqual(comparatifs.courant.totalBrut, 1000);
    expectDecimalEqual(comparatifs.m1.totalBrut, 900);
    expectDecimalEqual(comparatifs.m3.totalBrut, 750);
    expectDecimalEqual(comparatifs.m12.totalBrut, 500);
    expectDecimalEqual(comparatifs.m1.variationBrutPct, 11.11, 0.02);
  });

  it('exporte les KPIs en CSV', async () => {
    const service = new SnapshotKpiService(createDeps());

    const exportResult = await service.exportAnalytique({
      ...filters,
      format: 'csv',
      includeComparatifs: true,
    });

    expect(exportResult.mimeType).toBe('text/csv');
    expect(exportResult.fileName.endsWith('.csv')).toBeTrue();
    expect(exportResult.content).toContain('periode,total_brut,total_net,total_reprises,total_recurrence,taux_reprise,volume,delai_validation');
    expect(exportResult.content).toContain('2026-01,1000.00,800.00,200.00,120.00,20.00,5,3.00');
  });

  it('gerre division par zero sur taux de reprise', async () => {
    const service = new SnapshotKpiService(createDeps({
      aggregateBrutNetReprises: async () => ({
        totalBrut: 0,
        totalNet: 0,
        totalReprises: 200,
        volume: 1,
      }),
    }));

    const snapshot = await service.genererSnapshot(filters, 'manual', 'user-1');
    expectDecimalEqual(snapshot.tauxReprise, 0);
  });
});

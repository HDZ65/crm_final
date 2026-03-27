import { describe, expect, it } from 'bun:test';
import {
  GenererBordereauWorkflowService,
  type GenererBordereauDeps,
} from '../generer-bordereau-workflow.service';

function createDeps(): GenererBordereauDeps {
  const lignes: Record<string, unknown>[] = [];
  const reprisesUpdates: Record<string, unknown>[] = [];
  const auditLogs: Record<string, unknown>[] = [];
  const bordereauUpdates: Record<string, unknown>[] = [];
  const recurrenceCalls: Record<string, unknown>[] = [];

  return {
    state: { lignes, reprisesUpdates, auditLogs, bordereauUpdates, recurrenceCalls },
    findCommissionsForPeriode: async () => [
      {
        id: 'com-1',
        organisationId: 'org-1',
        apporteurId: 'app-1',
        contratId: 'ctr-1',
        reference: 'COM-001',
        montantBrut: 100,
        montantReprises: 0,
        montantAcomptes: 0,
        montantNetAPayer: 100,
        statutId: 'st-a-payer',
        periode: '2026-01',
        dateCreation: new Date('2026-01-12'),
      },
      {
        id: 'com-2',
        organisationId: 'org-1',
        apporteurId: 'app-1',
        contratId: 'ctr-2',
        reference: 'COM-002',
        montantBrut: 200,
        montantReprises: 0,
        montantAcomptes: 0,
        montantNetAPayer: 200,
        statutId: 'st-a-payer',
        periode: '2026-01',
        dateCreation: new Date('2026-01-13'),
      },
    ],
    findBaremeForCommission: async () => ({
      id: 'brm-1',
      code: 'BRM-1',
      typeCalcul: 'pourcentage',
      montantFixe: null,
      tauxPourcentage: 10,
      paliers: [],
    }),
    calculerCommission: (contrat, bareme, montantBase) => ({
      montantCalcule: Math.round(((montantBase * 10) / 100 + Number.EPSILON) * 100) / 100,
      typeCalcul: bareme.typeCalcul,
      details: { contrat },
    }),
    findStatutAPayer: async () => ({ id: 'st-a-payer', code: 'a_payer' }),
    findReprisesForPeriode: async () => [
      {
        id: 'rep-1',
        commissionOriginaleId: 'com-1',
        contratId: 'ctr-1',
        apporteurId: 'app-1',
        typeReprise: 'impaye',
        periodeApplication: '2026-01',
      },
    ],
    calculerReprise: async () => ({
      totalCommissionsFenetre: 100,
      commissionDuePeriode: 100,
      montantReprise: 30,
      suspendRecurrence: true,
      creerLigneReprise: true,
    }),
    updateReprise: async (_id, payload) => {
      reprisesUpdates.push(payload);
    },
    findRecurrencesForPeriode: async () => [
      {
        id: 'rec-1',
        contratId: 'ctr-3',
        echeanceId: 'ech-1',
        dateEncaissement: new Date('2026-01-14'),
        montantCalcule: 9,
      },
    ],
    genererRecurrence: async (contratId, echeanceId, dateEncaissement) => {
      recurrenceCalls.push({ contratId, echeanceId, dateEncaissement });
      return {
        creee: true,
        raison: null,
        recurrence: {
          contratId,
          echeanceId,
          dateEncaissement: new Date(dateEncaissement),
          periode: '2026-01',
          numeroMois: 2,
          baremeId: 'brm-rec-1',
          baremeVersion: 1,
          montantBase: 300,
          tauxRecurrence: 3,
          montantCalcule: 9,
          statutRecurrence: 'active',
        },
      };
    },
    findReportsNegatifs: async () => [
      {
        id: 'rpt-1',
        periodeOrigine: '2025-12',
        montantRestant: 40,
      },
    ],
    createBordereau: async () => ({
      id: 'brd-1',
      organisationId: 'org-1',
      apporteurId: 'app-1',
      reference: 'BRD-2026-01-001',
      periode: '2026-01',
      totalBrut: 0,
      totalReprises: 0,
      totalAcomptes: 0,
      totalNetAPayer: 0,
      nombreLignes: 0,
    }),
    createLigne: async (payload) => {
      lignes.push(payload);
      return { id: `line-${lignes.length}`, ...payload };
    },
    updateBordereau: async (_id, payload) => {
      bordereauUpdates.push(payload);
      return {
        id: 'brd-1',
        organisationId: 'org-1',
        apporteurId: 'app-1',
        reference: 'BRD-2026-01-001',
        periode: '2026-01',
        ...payload,
      };
    },
    audit: async (payload) => {
      auditLogs.push(payload);
    },
  };
}

describe('GenererBordereauWorkflowService', () => {
  it('creates bordereau with commission lines', async () => {
    const deps = createDeps();
    const service = new GenererBordereauWorkflowService(deps);

    await service.execute({ organisationId: 'org-1', apporteurId: 'app-1', periode: '2026-01', creePar: 'ops' });

    const commissionLines = deps.state.lignes.filter((line) => line.typeLigne === 'commission');
    expect(commissionLines.length).toBe(2);
  });

  it('auto-applies reprises and creates reprise lines', async () => {
    const deps = createDeps();
    const service = new GenererBordereauWorkflowService(deps);

    await service.execute({ organisationId: 'org-1', apporteurId: 'app-1', periode: '2026-01' });

    expect(deps.state.reprisesUpdates.length).toBe(1);
    const repriseLines = deps.state.lignes.filter((line) => line.typeLigne === 'reprise');
    expect(repriseLines.length).toBe(1);
  });

  it('includes recurrences', async () => {
    const deps = createDeps();
    const service = new GenererBordereauWorkflowService(deps);

    await service.execute({ organisationId: 'org-1', apporteurId: 'app-1', periode: '2026-01' });

    expect(deps.state.recurrenceCalls.length).toBe(1);
    const recurrenceLines = deps.state.lignes.filter((line) => line.typeLigne === 'prime');
    expect(recurrenceLines.length).toBe(1);
  });

  it('calculates totals brut/reprises/acomptes/net', async () => {
    const deps = createDeps();
    const service = new GenererBordereauWorkflowService(deps);

    const result = await service.execute({ organisationId: 'org-1', apporteurId: 'app-1', periode: '2026-01' });

    expect(result.totaux.totalBrut).toBe(30);
    expect(result.totaux.totalReprises).toBe(30);
    expect(result.totaux.totalAcomptes).toBe(40);
    expect(result.totaux.totalNet).toBe(-40);
  });

  it('includes reports negatifs from previous periods and logs audit trail', async () => {
    const deps = createDeps();
    const service = new GenererBordereauWorkflowService(deps);

    await service.execute({ organisationId: 'org-1', apporteurId: 'app-1', periode: '2026-01' });

    const reportLines = deps.state.lignes.filter((line) => line.typeLigne === 'acompte');
    expect(reportLines.length).toBe(1);
    expect(Number(reportLines[0].montantNet)).toBe(-40);
    expect(deps.state.auditLogs.length).toBeGreaterThanOrEqual(4);
  });
});

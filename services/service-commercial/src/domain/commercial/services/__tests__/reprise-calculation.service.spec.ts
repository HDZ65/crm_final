import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import { TypeReprise } from '../../entities/reprise-commission.entity';
import { expectDecimalEqual } from './helpers/decimal-helpers';
import {
  RepriseCalculationService,
  type RepriseDependencies,
  type RepriseInput,
} from '../reprise-calculation.service';

function createService(overrides: Partial<RepriseDependencies> = {}) {
  const deps: RepriseDependencies = {
    findCommissionsVerseesDansFenetre: async () => [100, 80, 70],
    findCommissionDuePeriode: async () => 500,
    now: () => new Date('2026-02-10T00:00:00.000Z'),
    ...overrides,
  };

  return new RepriseCalculationService(deps);
}

describe('RepriseCalculationService', () => {
  it('resiliation infra-annuelle (3 mois): reprise 100% des commissions versees', async () => {
    const service = createService({
      findCommissionsVerseesDansFenetre: async () => [120, 90, 60],
      findCommissionDuePeriode: async () => 500,
    });

    const result = await service.calculerReprise('contrat-1', TypeReprise.RESILIATION, 3, '2026-02');

    expectDecimalEqual(result.montantReprise, 270);
    expect(result.suspendRecurrence).toBe(false);
  });

  it('resiliation assurance fenetre 12 mois: applique la formule min(sum, due periode)', async () => {
    const service = createService({
      findCommissionsVerseesDansFenetre: async () => [150, 130, 120, 90, 70],
      findCommissionDuePeriode: async () => 300,
    });

    const result = await service.calculerReprise('contrat-assurance-1', TypeReprise.RESILIATION, 12, '2026-02');

    expectDecimalEqual(result.totalCommissionsFenetre, 560);
    expectDecimalEqual(result.commissionDuePeriode, 300);
    expectDecimalEqual(result.montantReprise, 300);
  });

  it('impaye: suspension recurrence + creation ligne reprise', async () => {
    const service = createService({
      findCommissionsVerseesDansFenetre: async () => [110],
      findCommissionDuePeriode: async () => 200,
    });

    const result = await service.calculerReprise('contrat-impaye-1', TypeReprise.IMPAYE, 6, '2026-02');

    expect(result.suspendRecurrence).toBe(true);
    expect(result.creerLigneReprise).toBe(true);
    expectDecimalEqual(result.montantReprise, 110);
  });

  it('regularisation positive: impaye solde cree une ligne positive automatique', async () => {
    const service = createService();

    const regularisation = service.genererRegularisation({
      id: 'reprise-1',
      contratId: 'contrat-impaye-1',
      typeReprise: TypeReprise.IMPAYE,
      montantReprise: 180,
      motif: 'Impayee janv',
      impayeSolde: true,
      periodeApplication: '2026-03',
    });

    expect(regularisation.creerLignePositive).toBe(true);
    expect(regularisation.typeReprise).toBe(TypeReprise.REGULARISATION);
    expectDecimalEqual(regularisation.montantRegularisation, 180);
  });

  it('report negatif: (brut - reprises - acomptes) < 0 reporte le positif sur periode suivante', () => {
    const service = createService();

    const report = service.calculerReportNegatif('apporteur-1', '2026-02', 500, 700, 0);

    expect(report.hasReport).toBe(true);
    expectDecimalEqual(report.soldeAvantReport, -200);
    expectDecimalEqual(report.montantReport, 200);
    expect(report.periodeSuivante).toBe('2026-03');
  });

  it('edge: aucune commission versee dans la fenetre => reprise = 0', async () => {
    const service = createService({
      findCommissionsVerseesDansFenetre: async () => [],
      findCommissionDuePeriode: async () => 450,
    });

    const result = await service.calculerReprise('contrat-sans-commission', TypeReprise.RESILIATION, 12, '2026-02');

    expectDecimalEqual(result.totalCommissionsFenetre, 0);
    expectDecimalEqual(result.montantReprise, 0);
  });

  it('edge: fenetre = 0 => throw DomainException', async () => {
    const service = createService();

    await expect(
      service.calculerReprise('contrat-1', TypeReprise.RESILIATION, 0, '2026-02'),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('regularisation ignoree si impaye non solde', () => {
    const service = createService();

    const repriseOriginale: RepriseInput = {
      id: 'reprise-2',
      contratId: 'contrat-impaye-2',
      typeReprise: TypeReprise.IMPAYE,
      montantReprise: 150,
      motif: 'Impayee fev',
      impayeSolde: false,
      periodeApplication: '2026-03',
    };

    const regularisation = service.genererRegularisation(repriseOriginale);
    expect(regularisation.creerLignePositive).toBe(false);
    expectDecimalEqual(regularisation.montantRegularisation, 0);
  });
});

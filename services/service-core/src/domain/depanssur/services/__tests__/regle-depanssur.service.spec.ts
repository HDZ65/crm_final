import { beforeEach, describe, expect, it } from 'bun:test';
import { EntityManager, Repository } from 'typeorm';
import { AbonnementDepanssurEntity } from '../../entities/abonnement-depanssur.entity';
import { CompteurPlafondEntity } from '../../entities/compteur-plafond.entity';
import { RegleDepanssurError, RegleDepanssurService } from '../regle-depanssur.service';

interface HarnessOptions {
  getOneQueue?: Array<CompteurPlafondEntity | null>;
  saveError?: Error;
  publishError?: Error;
}

function makeAbonnement(overrides: Partial<AbonnementDepanssurEntity> = {}): AbonnementDepanssurEntity {
  return {
    id: 'abonnement-1',
    organisationId: 'org-1',
    clientId: 'client-1',
    planType: 'STANDARD',
    periodicite: 'ANNUELLE',
    periodeAttente: 30,
    franchise: null,
    plafondParIntervention: '500.00',
    plafondAnnuel: '2000.00',
    nbInterventionsMax: 10,
    statut: 'ACTIF',
    motifResiliation: null,
    dateSouscription: new Date('2026-01-01T00:00:00.000Z'),
    dateEffet: new Date('2026-01-01T00:00:00.000Z'),
    dateFin: null,
    prochaineEcheance: new Date('2027-01-01T00:00:00.000Z'),
    prixTtc: '29.99',
    tauxTva: '20.00',
    montantHt: '24.99',
    codeRemise: null,
    montantRemise: null,
    options: [],
    compteurs: [],
    historique: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as AbonnementDepanssurEntity;
}

function makeCompteur(overrides: Partial<CompteurPlafondEntity> = {}): CompteurPlafondEntity {
  return {
    id: 'compteur-1',
    abonnementId: 'abonnement-1',
    abonnement: makeAbonnement(),
    anneeGlissanteDebut: new Date('2026-01-01T00:00:00.000Z'),
    anneeGlissanteFin: new Date('2027-01-01T00:00:00.000Z'),
    nbInterventionsUtilisees: 2,
    montantCumule: '300.00',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as CompteurPlafondEntity;
}

function createHarness(options: HarnessOptions = {}) {
  const publishCalls: Array<{ subject: string; payload: unknown }> = [];
  const setLockCalls: string[] = [];
  const saveCalls: CompteurPlafondEntity[] = [];
  const createCalls: Array<Partial<CompteurPlafondEntity>> = [];
  const getOneQueue = options.getOneQueue ? [...options.getOneQueue] : [makeCompteur()];

  const qb = {
    setLock: (mode: string) => {
      setLockCalls.push(mode);
      return qb;
    },
    where: () => qb,
    andWhere: () => qb,
    orderBy: () => qb,
    getOne: async () => getOneQueue.shift() ?? null,
  };

  const compteurEntityRepository = {
    createQueryBuilder: () => qb,
    create: (payload: Partial<CompteurPlafondEntity>) => {
      createCalls.push(payload);
      return {
        id: 'compteur-new',
        abonnementId: payload.abonnementId ?? 'abonnement-1',
        abonnement: makeAbonnement(),
        anneeGlissanteDebut: payload.anneeGlissanteDebut ?? new Date('2026-01-01T00:00:00.000Z'),
        anneeGlissanteFin: payload.anneeGlissanteFin ?? new Date('2027-01-01T00:00:00.000Z'),
        nbInterventionsUtilisees: payload.nbInterventionsUtilisees ?? 0,
        montantCumule: payload.montantCumule ?? '0.00',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      } as CompteurPlafondEntity;
    },
    save: async (entity: CompteurPlafondEntity) => {
      if (options.saveError) {
        throw options.saveError;
      }
      saveCalls.push(entity);
      return entity;
    },
  };

  const manager = {
    getRepository: () => compteurEntityRepository,
  } as unknown as EntityManager;

  const transactionCalls: number[] = [];
  const compteurRepository = {
    manager: {
      transaction: async (cb: (transactionManager: EntityManager) => Promise<CompteurPlafondEntity>) => {
        transactionCalls.push(1);
        return cb(manager);
      },
    },
  } as unknown as Repository<CompteurPlafondEntity>;

  const natsService = {
    publish: async (subject: string, payload: unknown) => {
      if (options.publishError) {
        throw options.publishError;
      }
      publishCalls.push({ subject, payload });
    },
  };

  const service = new RegleDepanssurService(compteurRepository, natsService as never);

  return {
    service,
    manager,
    publishCalls,
    setLockCalls,
    saveCalls,
    createCalls,
    transactionCalls,
  };
}

describe('RegleDepanssurService', () => {
  let service: RegleDepanssurService;

  beforeEach(() => {
    ({ service } = createHarness());
  });

  describe('validerCarence()', () => {
    it('should block when carence not expired', () => {
      const abonnement = makeAbonnement({
        dateEffet: new Date('2026-01-01T00:00:00.000Z'),
        periodeAttente: 30,
      });

      const result = service.validerCarence(abonnement, new Date('2026-01-30T00:00:00.000Z'));

      expect(result.valide).toBe(false);
      expect(result.raison).toBe('CARENCE_EN_COURS');
      expect(result.dateFinCarence.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    });

    it('should authorize when carence expired', () => {
      const abonnement = makeAbonnement({
        dateEffet: new Date('2026-01-01T00:00:00.000Z'),
        periodeAttente: 30,
      });

      const result = service.validerCarence(abonnement, new Date('2026-02-02T00:00:00.000Z'));

      expect(result.valide).toBe(true);
      expect(result.raison).toBeUndefined();
    });

    it('should authorize on exact carence end date', () => {
      const abonnement = makeAbonnement({
        dateEffet: new Date('2026-01-01T00:00:00.000Z'),
        periodeAttente: 30,
      });

      const result = service.validerCarence(abonnement, new Date('2026-01-31T00:00:00.000Z'));

      expect(result.valide).toBe(true);
      expect(result.dateFinCarence.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    });

    it('should throw when abonnement has no dateEffet', () => {
      const abonnement = makeAbonnement({ dateEffet: null as never });

      expect(() => service.validerCarence(abonnement, new Date('2026-01-10T00:00:00.000Z'))).toThrow(RegleDepanssurError);
      expect(() => service.validerCarence(abonnement, new Date('2026-01-10T00:00:00.000Z'))).toThrow(
        'La date d\'effet de l\'abonnement est requise',
      );
    });

    it('should authorize immediately when carence is zero day', () => {
      const abonnement = makeAbonnement({
        dateEffet: new Date('2026-03-10T00:00:00.000Z'),
        periodeAttente: 0,
      });

      const result = service.validerCarence(abonnement, new Date('2026-03-10T00:00:00.000Z'));

      expect(result.valide).toBe(true);
      expect(result.dateFinCarence.toISOString()).toBe('2026-03-10T00:00:00.000Z');
    });
  });

  describe('verifierPlafonds()', () => {
    it('should refuse when plafond per intervention is exceeded', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '100.00',
        plafondAnnuel: '2000.00',
        nbInterventionsMax: 10,
      });

      const result = service.verifierPlafonds(abonnement, 120, makeCompteur({ montantCumule: '200.00', nbInterventionsUtilisees: 2 }));

      expect(result.autorise).toBe(false);
      expect(result.raison).toBe('PLAFOND_PAR_INTERVENTION_DEPASSE');
      expect(result.plafondsRestants.parIntervention).toBe(0);
    });

    it('should refuse when annual amount ceiling is exceeded', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '500.00',
        plafondAnnuel: '1000.00',
        nbInterventionsMax: 10,
      });

      const result = service.verifierPlafonds(abonnement, 300, makeCompteur({ montantCumule: '800.00', nbInterventionsUtilisees: 4 }));

      expect(result.autorise).toBe(false);
      expect(result.raison).toBe('PLAFOND_ANNUEL_DEPASSE');
      expect(result.plafondsRestants.annuelMontant).toBe(0);
    });

    it('should refuse when max interventions count is exceeded', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '500.00',
        plafondAnnuel: '3000.00',
        nbInterventionsMax: 3,
      });

      const result = service.verifierPlafonds(abonnement, 200, makeCompteur({ montantCumule: '1000.00', nbInterventionsUtilisees: 3 }));

      expect(result.autorise).toBe(false);
      expect(result.raison).toBe('NB_INTERVENTIONS_MAX_DEPASSE');
      expect(result.plafondsRestants.annuelInterventions).toBe(0);
    });

    it('should authorize when all ceilings are respected', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '500.00',
        plafondAnnuel: '2000.00',
        nbInterventionsMax: 10,
      });

      const result = service.verifierPlafonds(abonnement, 200, makeCompteur({ montantCumule: '1000.00', nbInterventionsUtilisees: 4 }));

      expect(result.autorise).toBe(true);
      expect(result.raison).toBeUndefined();
      expect(result.plafondsRestants.parIntervention).toBe(300);
      expect(result.plafondsRestants.annuelMontant).toBe(800);
      expect(result.plafondsRestants.annuelInterventions).toBe(5);
    });

    it('should authorize when ceilings are null (unlimited)', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: null,
        plafondAnnuel: null,
        nbInterventionsMax: null,
      });

      const result = service.verifierPlafonds(abonnement, 999999, makeCompteur({ montantCumule: '500000.00', nbInterventionsUtilisees: 1000 }));

      expect(result.autorise).toBe(true);
      expect(result.plafondsRestants.parIntervention).toBeNull();
      expect(result.plafondsRestants.annuelMontant).toBeNull();
      expect(result.plafondsRestants.annuelInterventions).toBeNull();
    });

    it('should authorize at 80 percent annual utilization (warning threshold context)', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '500.00',
        plafondAnnuel: '1000.00',
        nbInterventionsMax: 10,
      });

      const result = service.verifierPlafonds(abonnement, 100, makeCompteur({ montantCumule: '700.00', nbInterventionsUtilisees: 2 }));

      expect(result.autorise).toBe(true);
      expect(result.plafondsRestants.annuelMontant).toBe(200);
    });

    it('should return per-intervention error when multiple ceilings are exceeded', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '100.00',
        plafondAnnuel: '150.00',
        nbInterventionsMax: 1,
      });

      const result = service.verifierPlafonds(abonnement, 200, makeCompteur({ montantCumule: '100.00', nbInterventionsUtilisees: 1 }));

      expect(result.autorise).toBe(false);
      expect(result.raison).toBe('PLAFOND_PAR_INTERVENTION_DEPASSE');
    });

    it('should handle null compteur as zero usage', () => {
      const abonnement = makeAbonnement({
        plafondParIntervention: '500.00',
        plafondAnnuel: '1000.00',
        nbInterventionsMax: 2,
      });

      const result = service.verifierPlafonds(abonnement, 200, null);

      expect(result.autorise).toBe(true);
      expect(result.plafondsRestants.annuelMontant).toBe(800);
      expect(result.plafondsRestants.annuelInterventions).toBe(1);
    });
  });

  describe('majCompteurs()', () => {
    it('should increment counters correctly', async () => {
      const harness = createHarness({
        getOneQueue: [makeCompteur({ nbInterventionsUtilisees: 1, montantCumule: '100.00' })],
      });
      const abonnement = makeAbonnement({ plafondParIntervention: '500.00', plafondAnnuel: null, nbInterventionsMax: null });

      const saved = await harness.service.majCompteurs(abonnement, 50, new Date('2026-06-01T00:00:00.000Z'), harness.manager);

      expect(saved.nbInterventionsUtilisees).toBe(2);
      expect(saved.montantCumule).toBe('150.00');
      expect(harness.saveCalls.length).toBe(1);
    });

    it('should throw when ceilings are exceeded', async () => {
      const harness = createHarness({
        getOneQueue: [makeCompteur({ nbInterventionsUtilisees: 0, montantCumule: '0.00' })],
      });
      const abonnement = makeAbonnement({ plafondParIntervention: '100.00', plafondAnnuel: null, nbInterventionsMax: null });

      await expect(
        harness.service.majCompteurs(abonnement, 250, new Date('2026-06-01T00:00:00.000Z'), harness.manager),
      ).rejects.toThrow(RegleDepanssurError);
      expect(harness.saveCalls.length).toBe(0);
    });

    it('should create a new counter when rolling year window expired', async () => {
      const harness = createHarness({
        getOneQueue: [null],
      });
      const abonnement = makeAbonnement({
        dateEffet: new Date('2025-01-01T00:00:00.000Z'),
        plafondParIntervention: null,
        plafondAnnuel: null,
        nbInterventionsMax: null,
      });

      const saved = await harness.service.majCompteurs(abonnement, 75, new Date('2026-02-01T00:00:00.000Z'), harness.manager);

      expect(harness.createCalls.length).toBe(1);
      expect(saved.anneeGlissanteDebut.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(saved.nbInterventionsUtilisees).toBe(1);
      expect(saved.montantCumule).toBe('75.00');
    });

    it('should propagate error and rollback transaction when persistence fails', async () => {
      const harness = createHarness({
        getOneQueue: [makeCompteur({ nbInterventionsUtilisees: 0, montantCumule: '0.00' })],
        saveError: new Error('DB_SAVE_FAILED'),
      });
      const abonnement = makeAbonnement({ plafondParIntervention: null, plafondAnnuel: null, nbInterventionsMax: null });

      await expect(harness.service.majCompteurs(abonnement, 100, new Date('2026-06-01T00:00:00.000Z'))).rejects.toThrow(
        'DB_SAVE_FAILED',
      );
      expect(harness.transactionCalls.length).toBe(1);
      expect(harness.publishCalls.length).toBe(0);
    });

    it('should enforce isolation lock during concurrent updates', async () => {
      const harness = createHarness({
        getOneQueue: [
          makeCompteur({ id: 'compteur-a', nbInterventionsUtilisees: 0, montantCumule: '0.00' }),
          makeCompteur({ id: 'compteur-b', nbInterventionsUtilisees: 1, montantCumule: '50.00' }),
        ],
      });
      const abonnement = makeAbonnement({ plafondParIntervention: null, plafondAnnuel: null, nbInterventionsMax: null });

      await Promise.all([
        harness.service.majCompteurs(abonnement, 20, new Date('2026-06-01T00:00:00.000Z'), harness.manager),
        harness.service.majCompteurs(abonnement, 30, new Date('2026-06-01T00:00:00.000Z'), harness.manager),
      ]);

      expect(harness.setLockCalls.length).toBe(2);
      expect(harness.setLockCalls.every((mode) => mode === 'pessimistic_write')).toBe(true);
      expect(harness.saveCalls.length).toBe(2);
    });

    it('should reset cycle on anniversary date and start a fresh counter', async () => {
      const harness = createHarness({
        getOneQueue: [null],
      });
      const abonnement = makeAbonnement({
        dateEffet: new Date('2026-01-01T00:00:00.000Z'),
        plafondParIntervention: null,
        plafondAnnuel: null,
        nbInterventionsMax: null,
      });

      const saved = await harness.service.majCompteurs(abonnement, 40, new Date('2027-01-01T00:00:00.000Z'), harness.manager);

      expect(saved.anneeGlissanteDebut.toISOString()).toBe('2027-01-01T00:00:00.000Z');
      expect(saved.anneeGlissanteFin.toISOString()).toBe('2028-01-01T00:00:00.000Z');
      expect(saved.nbInterventionsUtilisees).toBe(1);
      expect(saved.montantCumule).toBe('40.00');
    });

    it('should publish threshold event when annual usage reaches 80 percent', async () => {
      const harness = createHarness({
        getOneQueue: [makeCompteur({ nbInterventionsUtilisees: 1, montantCumule: '700.00' })],
      });
      const abonnement = makeAbonnement({
        plafondParIntervention: null,
        plafondAnnuel: '1000.00',
        nbInterventionsMax: null,
      });

      await harness.service.majCompteurs(abonnement, 100, new Date('2026-06-01T00:00:00.000Z'), harness.manager);

      expect(harness.publishCalls.length).toBe(1);
      expect(harness.publishCalls[0].subject).toBe('depanssur.plafond.threshold_reached');
    });

    it('should not fail counter update when threshold event publication fails', async () => {
      const harness = createHarness({
        getOneQueue: [makeCompteur({ nbInterventionsUtilisees: 1, montantCumule: '750.00' })],
        publishError: new Error('NATS_DOWN'),
      });
      const abonnement = makeAbonnement({
        plafondParIntervention: null,
        plafondAnnuel: '1000.00',
        nbInterventionsMax: null,
      });

      const saved = await harness.service.majCompteurs(abonnement, 50, new Date('2026-06-01T00:00:00.000Z'), harness.manager);

      expect(saved.nbInterventionsUtilisees).toBe(2);
      expect(saved.montantCumule).toBe('800.00');
      expect(harness.publishCalls.length).toBe(0);
    });

    it('should publish exceeded event for already inconsistent over-limit counters', async () => {
      const harness = createHarness();
      const abonnement = makeAbonnement({ plafondAnnuel: '1000.00' });
      const compteur = makeCompteur({ montantCumule: '1200.00' });

      await (harness.service as any).checkPlafondThresholds(abonnement, compteur);

      expect(harness.publishCalls.length).toBe(1);
      expect(harness.publishCalls[0].subject).toBe('depanssur.plafond.exceeded');
    });
  });

  describe('resetCompteurAnnuel()', () => {
    it('should reuse existing counter when reference is inside current cycle', async () => {
      const existing = makeCompteur({
        anneeGlissanteDebut: new Date('2026-01-01T00:00:00.000Z'),
        anneeGlissanteFin: new Date('2027-01-01T00:00:00.000Z'),
      });
      const harness = createHarness({ getOneQueue: [existing] });
      const abonnement = makeAbonnement({ dateEffet: new Date('2026-01-01T00:00:00.000Z') });

      const result = await harness.service.resetCompteurAnnuel(abonnement, new Date('2026-06-01T00:00:00.000Z'), harness.manager);

      expect(result.id).toBe(existing.id);
      expect(harness.createCalls.length).toBe(0);
    });

    it('should create a new counter in transaction when no manager is passed', async () => {
      const harness = createHarness({ getOneQueue: [null] });
      const abonnement = makeAbonnement({ dateEffet: new Date('2026-01-01T00:00:00.000Z') });

      const result = await harness.service.resetCompteurAnnuel(abonnement, new Date('2027-02-01T00:00:00.000Z'));

      expect(harness.transactionCalls.length).toBe(1);
      expect(harness.createCalls.length).toBe(1);
      expect(result.anneeGlissanteDebut.toISOString()).toBe('2027-01-01T00:00:00.000Z');
      expect(result.anneeGlissanteFin.toISOString()).toBe('2028-01-01T00:00:00.000Z');
    });
  });

  describe('upgraderPlan()', () => {
    it('should apply upgrade immediately with effect date equal to request date', () => {
      const abonnement = makeAbonnement({ planType: 'STANDARD' });
      const dateDemande = new Date('2026-05-05T00:00:00.000Z');

      const result = service.upgraderPlan(abonnement, 'PREMIUM', dateDemande);

      expect(result.estImmediat).toBe(true);
      expect(result.dateEffet.toISOString()).toBe('2026-05-05T00:00:00.000Z');
    });

    it('should set new plan as effective plan', () => {
      const abonnement = makeAbonnement({ planType: 'STANDARD' });

      const result = service.upgraderPlan(abonnement, 'ESSENTIEL', new Date('2026-06-01T00:00:00.000Z'));

      expect(result.planTypeEffectif).toBe('ESSENTIEL');
    });

    it('should return deterministic effect data for history persistence', () => {
      const abonnement = makeAbonnement({ planType: 'STANDARD' });

      const result = service.upgraderPlan(abonnement, 'PREMIUM', new Date('2026-07-10T00:00:00.000Z'));

      expect(result).toEqual({
        estImmediat: true,
        dateEffet: new Date('2026-07-10T00:00:00.000Z'),
        planTypeEffectif: 'PREMIUM',
      });
    });
  });

  describe('downgraderPlan()', () => {
    it('should defer downgrade to next due date when requested before due date', () => {
      const abonnement = makeAbonnement({
        planType: 'PREMIUM',
        prochaineEcheance: new Date('2026-12-31T00:00:00.000Z'),
      });

      const result = service.downgraderPlan(abonnement, 'STANDARD', new Date('2026-11-15T00:00:00.000Z'));

      expect(result.estImmediat).toBe(false);
      expect(result.dateEffet.toISOString()).toBe('2026-12-31T00:00:00.000Z');
    });

    it('should apply downgrade immediately when requested after due date', () => {
      const abonnement = makeAbonnement({
        planType: 'PREMIUM',
        prochaineEcheance: new Date('2026-12-31T00:00:00.000Z'),
      });

      const result = service.downgraderPlan(abonnement, 'STANDARD', new Date('2027-01-02T00:00:00.000Z'));

      expect(result.estImmediat).toBe(true);
      expect(result.dateEffet.toISOString()).toBe('2027-01-02T00:00:00.000Z');
      expect(result.planTypeEffectif).toBe('STANDARD');
    });

    it('should keep current plan effective until N+1 when request is before due date', () => {
      const abonnement = makeAbonnement({
        planType: 'PREMIUM',
        prochaineEcheance: new Date('2026-12-31T00:00:00.000Z'),
      });

      const result = service.downgraderPlan(abonnement, 'STANDARD', new Date('2026-12-01T00:00:00.000Z'));

      expect(result.planTypeEffectif).toBe('PREMIUM');
      expect(result.estImmediat).toBe(false);
    });

    it('should return explicit scheduling data suitable for history persistence', () => {
      const abonnement = makeAbonnement({
        planType: 'PREMIUM',
        prochaineEcheance: new Date('2026-12-31T00:00:00.000Z'),
      });

      const result = service.downgraderPlan(abonnement, 'STANDARD', new Date('2026-12-30T00:00:00.000Z'));

      expect(result).toEqual({
        estImmediat: false,
        dateEffet: new Date('2026-12-31T00:00:00.000Z'),
        planTypeEffectif: 'PREMIUM',
      });
    });
  });

  describe('changerAdresseRisque()', () => {
    it('should apply address risk change immediately when before cutoff', () => {
      const abonnement = makeAbonnement({ prochaineEcheance: new Date('2027-01-01T00:00:00.000Z') });

      const result = service.changerAdresseRisque(
        abonnement,
        new Date('2026-05-01T00:00:00.000Z'),
        new Date('2026-05-10T00:00:00.000Z'),
      );

      expect(result.estImmediat).toBe(true);
      expect(result.dateEffet.toISOString()).toBe('2026-05-01T00:00:00.000Z');
    });

    it('should defer address risk change to N+1 when after cutoff', () => {
      const abonnement = makeAbonnement({ prochaineEcheance: new Date('2027-01-15T00:00:00.000Z') });

      const result = service.changerAdresseRisque(
        abonnement,
        new Date('2026-05-11T00:00:00.000Z'),
        new Date('2026-05-10T00:00:00.000Z'),
      );

      expect(result.estImmediat).toBe(false);
      expect(result.dateEffet.toISOString()).toBe('2027-01-15T00:00:00.000Z');
    });

    it('should apply address risk change immediately at exact cutoff date', () => {
      const abonnement = makeAbonnement({ prochaineEcheance: new Date('2027-01-15T00:00:00.000Z') });

      const result = service.changerAdresseRisque(
        abonnement,
        new Date('2026-05-10T00:00:00.000Z'),
        new Date('2026-05-10T00:00:00.000Z'),
      );

      expect(result.estImmediat).toBe(true);
      expect(result.dateEffet.toISOString()).toBe('2026-05-10T00:00:00.000Z');
    });
  });
});

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NatsService } from '@crm/shared-kernel';
import { randomUUID } from 'crypto';
import { AbonnementDepanssurEntity } from '../entities/abonnement-depanssur.entity';
import { CompteurPlafondEntity } from '../entities/compteur-plafond.entity';

export class RegleDepanssurError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RegleDepanssurError';
  }
}

export interface CarenceValidationResult {
  valide: boolean;
  dateFinCarence: Date;
  raison?: string;
}

export interface PlafondsRestants {
  parIntervention: number | null;
  annuelMontant: number | null;
  annuelInterventions: number | null;
}

export interface PlafondValidationResult {
  autorise: boolean;
  raison?: string;
  plafondsRestants: PlafondsRestants;
}

export interface PlanChangeResult {
  estImmediat: boolean;
  dateEffet: Date;
  planTypeEffectif: string;
}

export interface AdresseRisqueChangeResult {
  estImmediat: boolean;
  dateEffet: Date;
}

@Injectable()
export class RegleDepanssurService {
  private readonly logger = new Logger(RegleDepanssurService.name);

  constructor(
    @InjectRepository(CompteurPlafondEntity)
    private readonly compteurRepository: Repository<CompteurPlafondEntity>,
    private readonly natsService: NatsService,
  ) {}

  validerCarence(abonnement: AbonnementDepanssurEntity, dateDossier: Date): CarenceValidationResult {
    if (!abonnement?.dateEffet) {
      throw new RegleDepanssurError('ABONNEMENT_DATE_EFFET_REQUIRED', 'La date d\'effet de l\'abonnement est requise');
    }

    const referenceDate = this.ensureDate(dateDossier, 'DATE_DOSSIER_INVALID');
    const periodeAttente = abonnement.periodeAttente ?? 0;
    const dateFinCarence = this.addUtcDays(this.ensureDate(abonnement.dateEffet, 'ABONNEMENT_DATE_EFFET_INVALID'), periodeAttente);

    if (referenceDate.getTime() < dateFinCarence.getTime()) {
      return {
        valide: false,
        dateFinCarence,
        raison: 'CARENCE_EN_COURS',
      };
    }

    return { valide: true, dateFinCarence };
  }

  verifierPlafonds(
    abonnement: AbonnementDepanssurEntity,
    montantIntervention: number,
    compteur: CompteurPlafondEntity | null,
  ): PlafondValidationResult {
    const montant = this.normalizeMontant(montantIntervention);
    const plafondParIntervention = this.parseNullableDecimal(abonnement?.plafondParIntervention);
    const plafondAnnuel = this.parseNullableDecimal(abonnement?.plafondAnnuel);
    const nbInterventionsMax = abonnement?.nbInterventionsMax ?? null;
    const montantCumule = this.parseDecimal(compteur?.montantCumule ?? 0);
    const nbInterventionsUtilisees = compteur?.nbInterventionsUtilisees ?? 0;

    if (plafondParIntervention !== null && montant > plafondParIntervention) {
      return {
        autorise: false,
        raison: 'PLAFOND_PAR_INTERVENTION_DEPASSE',
        plafondsRestants: {
          parIntervention: 0,
          annuelMontant: plafondAnnuel === null ? null : Math.max(0, this.roundMontant(plafondAnnuel - montantCumule)),
          annuelInterventions: nbInterventionsMax === null ? null : Math.max(0, nbInterventionsMax - nbInterventionsUtilisees),
        },
      };
    }

    const montantAnnuelProjet = this.roundMontant(montantCumule + montant);
    if (plafondAnnuel !== null && montantAnnuelProjet > plafondAnnuel) {
      return {
        autorise: false,
        raison: 'PLAFOND_ANNUEL_DEPASSE',
        plafondsRestants: {
          parIntervention:
            plafondParIntervention === null
              ? null
              : Math.max(0, this.roundMontant(plafondParIntervention - montant)),
          annuelMontant: 0,
          annuelInterventions: nbInterventionsMax === null ? null : Math.max(0, nbInterventionsMax - nbInterventionsUtilisees),
        },
      };
    }

    const nbInterventionsProjet = nbInterventionsUtilisees + 1;
    if (nbInterventionsMax !== null && nbInterventionsProjet > nbInterventionsMax) {
      return {
        autorise: false,
        raison: 'NB_INTERVENTIONS_MAX_DEPASSE',
        plafondsRestants: {
          parIntervention:
            plafondParIntervention === null
              ? null
              : Math.max(0, this.roundMontant(plafondParIntervention - montant)),
          annuelMontant: plafondAnnuel === null ? null : Math.max(0, this.roundMontant(plafondAnnuel - montantCumule)),
          annuelInterventions: 0,
        },
      };
    }

    return {
      autorise: true,
      plafondsRestants: {
        parIntervention:
          plafondParIntervention === null ? null : Math.max(0, this.roundMontant(plafondParIntervention - montant)),
        annuelMontant:
          plafondAnnuel === null ? null : Math.max(0, this.roundMontant(plafondAnnuel - montantAnnuelProjet)),
        annuelInterventions:
          nbInterventionsMax === null ? null : Math.max(0, nbInterventionsMax - nbInterventionsProjet),
      },
    };
  }

  async majCompteurs(
    abonnement: AbonnementDepanssurEntity,
    montantIntervention: number,
    dateReference: Date = new Date(),
    manager?: EntityManager,
  ): Promise<CompteurPlafondEntity> {
    const montant = this.normalizeMontant(montantIntervention);

    if (manager) {
      return this.incrementCompteur(manager, abonnement, montant, dateReference);
    }

    return this.compteurRepository.manager.transaction((transactionManager) =>
      this.incrementCompteur(transactionManager, abonnement, montant, dateReference),
    );
  }

  upgraderPlan(
    abonnement: AbonnementDepanssurEntity,
    nouveauPlan: string,
    dateDemande: Date = new Date(),
  ): PlanChangeResult {
    this.ensureDate(abonnement?.prochaineEcheance, 'ABONNEMENT_PROCHAINE_ECHEANCE_INVALID');

    return {
      estImmediat: true,
      dateEffet: this.ensureDate(dateDemande, 'DATE_DEMANDE_INVALID'),
      planTypeEffectif: nouveauPlan,
    };
  }

  downgraderPlan(
    abonnement: AbonnementDepanssurEntity,
    nouveauPlan: string,
    dateDemande: Date = new Date(),
  ): PlanChangeResult {
    const demande = this.ensureDate(dateDemande, 'DATE_DEMANDE_INVALID');
    const prochaineEcheance = this.ensureDate(abonnement?.prochaineEcheance, 'ABONNEMENT_PROCHAINE_ECHEANCE_INVALID');

    if (demande.getTime() < prochaineEcheance.getTime()) {
      return {
        estImmediat: false,
        dateEffet: prochaineEcheance,
        planTypeEffectif: abonnement.planType,
      };
    }

    return {
      estImmediat: true,
      dateEffet: demande,
      planTypeEffectif: nouveauPlan,
    };
  }

  changerAdresseRisque(
    abonnement: AbonnementDepanssurEntity,
    dateDemande: Date,
    dateCutoff: Date,
  ): AdresseRisqueChangeResult {
    const demande = this.ensureDate(dateDemande, 'DATE_DEMANDE_INVALID');
    const cutoff = this.ensureDate(dateCutoff, 'DATE_CUTOFF_INVALID');

    if (demande.getTime() <= cutoff.getTime()) {
      return {
        estImmediat: true,
        dateEffet: demande,
      };
    }

    return {
      estImmediat: false,
      dateEffet: this.ensureDate(abonnement?.prochaineEcheance, 'ABONNEMENT_PROCHAINE_ECHEANCE_INVALID'),
    };
  }

  async resetCompteurAnnuel(
    abonnement: AbonnementDepanssurEntity,
    dateReference: Date = new Date(),
    manager?: EntityManager,
  ): Promise<CompteurPlafondEntity> {
    const normalizedReference = this.ensureDate(dateReference, 'DATE_REFERENCE_INVALID');

    if (manager) {
      return this.getOrCreateCompteurForCycle(manager, abonnement, normalizedReference);
    }

    return this.compteurRepository.manager.transaction((transactionManager) =>
      this.getOrCreateCompteurForCycle(transactionManager, abonnement, normalizedReference),
    );
  }

  private async incrementCompteur(
    manager: EntityManager,
    abonnement: AbonnementDepanssurEntity,
    montantIntervention: number,
    dateReference: Date,
  ): Promise<CompteurPlafondEntity> {
    const compteur = await this.getOrCreateCompteurForCycle(manager, abonnement, this.ensureDate(dateReference, 'DATE_REFERENCE_INVALID'));
    const verification = this.verifierPlafonds(abonnement, montantIntervention, compteur);

    if (!verification.autorise) {
      throw new RegleDepanssurError(
        verification.raison ?? 'PLAFOND_DEPASSE',
        'Le dossier depasse les plafonds de prise en charge de l\'abonnement',
      );
    }

    compteur.nbInterventionsUtilisees += 1;
    compteur.montantCumule = this.formatDecimal(this.parseDecimal(compteur.montantCumule) + montantIntervention);

    const saved = await manager.getRepository(CompteurPlafondEntity).save(compteur);

    // Check for plafond threshold and exceeded events
    await this.checkPlafondThresholds(abonnement, saved);

    return saved;
  }

  private async getOrCreateCompteurForCycle(
    manager: EntityManager,
    abonnement: AbonnementDepanssurEntity,
    dateReference: Date,
  ): Promise<CompteurPlafondEntity> {
    if (!abonnement?.id) {
      throw new RegleDepanssurError('ABONNEMENT_ID_REQUIRED', 'L\'identifiant abonnement est requis');
    }

    const reference = this.ensureDate(dateReference, 'DATE_REFERENCE_INVALID');
    const cycle = this.getCycleWindow(abonnement, reference);
    const repository = manager.getRepository(CompteurPlafondEntity);

    const compteur = await repository
      .createQueryBuilder('compteur')
      .setLock('pessimistic_write')
      .where('compteur.abonnementId = :abonnementId', { abonnementId: abonnement.id })
      .andWhere('compteur.anneeGlissanteDebut <= :reference', { reference })
      .andWhere('compteur.anneeGlissanteFin > :reference', { reference })
      .orderBy('compteur.anneeGlissanteDebut', 'DESC')
      .getOne();

    if (compteur) {
      return compteur;
    }

    const nouveauCompteur = repository.create({
      abonnementId: abonnement.id,
      anneeGlissanteDebut: cycle.debut,
      anneeGlissanteFin: cycle.fin,
      nbInterventionsUtilisees: 0,
      montantCumule: '0.00',
    });

    return repository.save(nouveauCompteur);
  }

  private getCycleWindow(abonnement: AbonnementDepanssurEntity, referenceDate: Date): { debut: Date; fin: Date } {
    if (!abonnement?.dateEffet) {
      throw new RegleDepanssurError('ABONNEMENT_DATE_EFFET_REQUIRED', 'La date d\'effet de l\'abonnement est requise');
    }

    const reference = this.ensureDate(referenceDate, 'DATE_REFERENCE_INVALID');
    let debut = this.ensureDate(abonnement.dateEffet, 'ABONNEMENT_DATE_EFFET_INVALID');
    let fin = this.addUtcYears(debut, 1);

    while (reference.getTime() < debut.getTime()) {
      debut = this.addUtcYears(debut, -1);
      fin = this.addUtcYears(debut, 1);
    }

    while (reference.getTime() >= fin.getTime()) {
      debut = fin;
      fin = this.addUtcYears(debut, 1);
    }

    return { debut, fin };
  }

  private ensureDate(value: Date | string | null | undefined, code: string): Date {
    if (!value) {
      throw new RegleDepanssurError(code, `Date invalide (${code})`);
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new RegleDepanssurError(code, `Date invalide (${code})`);
    }

    return date;
  }

  private addUtcDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private addUtcYears(date: Date, years: number): Date {
    const year = date.getUTCFullYear() + years;
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const milliseconds = date.getUTCMilliseconds();

    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const safeDay = Math.min(day, lastDayOfMonth);

    return new Date(Date.UTC(year, month, safeDay, hours, minutes, seconds, milliseconds));
  }

  private normalizeMontant(value: number): number {
    const montant = Number(value ?? 0);
    if (!Number.isFinite(montant)) {
      throw new RegleDepanssurError('MONTANT_INTERVENTION_INVALID', 'Le montant d\'intervention est invalide');
    }
    if (montant < 0) {
      throw new RegleDepanssurError('MONTANT_INTERVENTION_NEGATIF', 'Le montant d\'intervention ne peut pas etre negatif');
    }
    return this.roundMontant(montant);
  }

  private parseDecimal(value: string | number | null | undefined): number {
    const decimal = Number(value ?? 0);
    if (!Number.isFinite(decimal)) {
      throw new RegleDepanssurError('DECIMAL_INVALID', 'Valeur decimale invalide');
    }
    return this.roundMontant(decimal);
  }

  private parseNullableDecimal(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return this.parseDecimal(value);
  }

  private roundMontant(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private formatDecimal(value: number): string {
    return this.roundMontant(value).toFixed(2);
  }

  private async checkPlafondThresholds(
    abonnement: AbonnementDepanssurEntity,
    compteur: CompteurPlafondEntity,
  ): Promise<void> {
    const plafondAnnuel = this.parseNullableDecimal(abonnement?.plafondAnnuel);
    if (plafondAnnuel === null) {
      return; // No annual ceiling configured
    }

    const montantUtilise = this.parseDecimal(compteur.montantCumule);
    const pourcentageUtilise = (montantUtilise / plafondAnnuel) * 100;

    // Check if exceeded
    if (montantUtilise > plafondAnnuel) {
      await this.publishPlafondExceededEvent(
        abonnement,
        plafondAnnuel,
        montantUtilise,
        montantUtilise - plafondAnnuel,
      );
      return;
    }

    // Check if threshold reached (80%)
    if (pourcentageUtilise >= 80) {
      await this.publishPlafondThresholdReachedEvent(
        abonnement,
        plafondAnnuel,
        montantUtilise,
        pourcentageUtilise,
      );
    }
  }

  private async publishPlafondThresholdReachedEvent(
    abonnement: AbonnementDepanssurEntity,
    plafondAnnuel: number,
    montantUtilise: number,
    pourcentageUtilise: number,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        abonnement_id: abonnement.id,
        client_id: abonnement.clientId,
        organisation_id: abonnement.organisationId,
        plafond_annuel: plafondAnnuel,
        montant_utilise: montantUtilise,
        pourcentage_utilise: pourcentageUtilise,
        reached_at: new Date(),
      };
      await this.natsService.publish('depanssur.plafond.threshold_reached', event);
      this.logger.debug(`Published depanssur.plafond.threshold_reached for ${abonnement.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.plafond.threshold_reached: ${error}`);
    }
  }

  private async publishPlafondExceededEvent(
    abonnement: AbonnementDepanssurEntity,
    plafondAnnuel: number,
    montantUtilise: number,
    montantDepasse: number,
  ): Promise<void> {
    try {
      const event = {
        event_id: randomUUID(),
        timestamp: Date.now(),
        correlation_id: null,
        abonnement_id: abonnement.id,
        client_id: abonnement.clientId,
        organisation_id: abonnement.organisationId,
        plafond_annuel: plafondAnnuel,
        montant_utilise: montantUtilise,
        montant_depasse: montantDepasse,
        exceeded_at: new Date(),
      };
      await this.natsService.publish('depanssur.plafond.exceeded', event);
      this.logger.debug(`Published depanssur.plafond.exceeded for ${abonnement.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish depanssur.plafond.exceeded: ${error}`);
    }
  }
}

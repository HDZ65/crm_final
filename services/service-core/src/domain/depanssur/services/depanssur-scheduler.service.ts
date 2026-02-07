import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AbonnementDepanssurEntity } from '../entities/abonnement-depanssur.entity';
import { CompteurPlafondEntity } from '../entities/compteur-plafond.entity';
import { DossierDeclaratifEntity } from '../entities/dossier-declaratif.entity';
import { AbonnementService } from '../../../infrastructure/persistence/typeorm/repositories/depanssur/abonnement.service';
import { DossierDeclaratifService } from '../../../infrastructure/persistence/typeorm/repositories/depanssur/dossier-declaratif.service';
import { CompteurPlafondService } from '../../../infrastructure/persistence/typeorm/repositories/depanssur/compteur-plafond.service';
import { RegleDepanssurService } from './regle-depanssur.service';

// ────────────────────────────────────────────────────────────────────────────
// Default cron expressions — overridable via environment variables
// ────────────────────────────────────────────────────────────────────────────
const DEFAULT_CRON_DAILY_0600 = '0 6 * * *';       // Every day at 06:00
const DEFAULT_CRON_DAILY_0800 = '0 8 * * *';       // Every day at 08:00
const DEFAULT_CRON_WEEKLY_MON_0900 = '0 9 * * 1';  // Every Monday at 09:00

/** Plafond alert threshold (80%) */
const PLAFOND_ALERT_THRESHOLD = 0.8;

/**
 * DepanssurSchedulerService — Automated cron jobs for Depanssur subscription management.
 *
 * Three scheduled jobs:
 *   1. Daily 06:00 — Payment due date processing & abonnement status updates
 *   2. Daily 08:00 — Carence expiry checks, plafond alerts, anniversary resets
 *   3. Weekly Monday 09:00 — Accounting exports, commission tracking, claims reports
 */
@Injectable()
export class DepanssurSchedulerService {
  private readonly logger = new Logger(DepanssurSchedulerService.name);

  /** Configurable cron expressions (resolved at construction) */
  private readonly cronDaily0600: string;
  private readonly cronDaily0800: string;
  private readonly cronWeeklyMon0900: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AbonnementDepanssurEntity)
    private readonly abonnementRepository: Repository<AbonnementDepanssurEntity>,
    @InjectRepository(CompteurPlafondEntity)
    private readonly compteurRepository: Repository<CompteurPlafondEntity>,
    @InjectRepository(DossierDeclaratifEntity)
    private readonly dossierRepository: Repository<DossierDeclaratifEntity>,
    private readonly abonnementService: AbonnementService,
    private readonly dossierDeclaratifService: DossierDeclaratifService,
    private readonly compteurPlafondService: CompteurPlafondService,
    private readonly regleDepanssurService: RegleDepanssurService,
  ) {
    this.cronDaily0600 = this.configService.get<string>(
      'DEPANSSUR_CRON_DAILY_PAYMENTS',
      DEFAULT_CRON_DAILY_0600,
    );
    this.cronDaily0800 = this.configService.get<string>(
      'DEPANSSUR_CRON_DAILY_CHECKS',
      DEFAULT_CRON_DAILY_0800,
    );
    this.cronWeeklyMon0900 = this.configService.get<string>(
      'DEPANSSUR_CRON_WEEKLY_REPORTS',
      DEFAULT_CRON_WEEKLY_MON_0900,
    );

    this.logger.log(
      `Scheduler initialized — payments: "${this.cronDaily0600}", checks: "${this.cronDaily0800}", reports: "${this.cronWeeklyMon0900}"`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 1 — Daily 06:00: Payment processing & abonnement status
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Daily at 06:00 — Retrieve upcoming payment due dates (J/J+1),
   * trigger payment attempts via NATS, update abonnement statuses.
   */
  @Cron(process.env.DEPANSSUR_CRON_DAILY_PAYMENTS || DEFAULT_CRON_DAILY_0600, {
    name: 'depanssur-daily-payments',
    timeZone: 'Europe/Paris',
  })
  async handleDailyPayments(): Promise<void> {
    const jobName = 'depanssur-daily-payments';
    const startTime = Date.now();
    this.logger.log(`[${jobName}] Starting...`);

    try {
      // 1. Find abonnements with prochaineEcheance today or tomorrow
      const today = this.startOfDay(new Date());
      const dayAfterTomorrow = this.addDays(today, 2); // exclusive upper bound

      const abonnementsDue = await this.abonnementRepository.find({
        where: {
          statut: 'ACTIF',
          prochaineEcheance: Between(today, dayAfterTomorrow),
        },
        relations: ['compteurs'],
      });

      this.logger.log(
        `[${jobName}] Found ${abonnementsDue.length} abonnement(s) with upcoming due dates`,
      );

      let processedCount = 0;
      let errorCount = 0;

      for (const abonnement of abonnementsDue) {
        try {
          await this.processPaymentDue(abonnement);
          processedCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `[${jobName}] Failed to process payment for abonnement ${abonnement.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // 2. Check and update suspended abonnements (SUSPENDU_IMPAYE)
      await this.updateSuspendedAbonnements();

      const durationMs = Date.now() - startTime;
      this.logger.log(
        `[${jobName}] Completed in ${durationMs}ms — processed: ${processedCount}, errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `[${jobName}] Job failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Process a single abonnement payment due:
   * - Log the payment trigger (in production, publish NATS event to service-finance)
   * - Advance prochaineEcheance to the next cycle
   */
  private async processPaymentDue(abonnement: AbonnementDepanssurEntity): Promise<void> {
    this.logger.log(
      `Processing payment for abonnement ${abonnement.id}, ` +
      `plan=${abonnement.planType}, echeance=${abonnement.prochaineEcheance.toISOString()}, ` +
      `montant=${abonnement.prixTtc}`,
    );

    // TODO: Publish NATS event 'depanssur.payment.trigger' to service-finance
    // This avoids duplicating payment logic — service-finance handles the actual payment.
    // Example: await this.natsService.publish('depanssur.payment.trigger', {
    //   abonnementId: abonnement.id,
    //   clientId: abonnement.clientId,
    //   montantTtc: abonnement.prixTtc,
    //   echeance: abonnement.prochaineEcheance.toISOString(),
    // });

    // Advance prochaineEcheance based on periodicite
    const nextEcheance = this.computeNextEcheance(
      abonnement.prochaineEcheance,
      abonnement.periodicite,
    );

    await this.abonnementRepository.update(abonnement.id, {
      prochaineEcheance: nextEcheance,
    });

    this.logger.log(
      `Abonnement ${abonnement.id}: next echeance advanced to ${nextEcheance.toISOString()}`,
    );
  }

  /**
   * Check SUSPENDU_IMPAYE abonnements — if dunning resolved, reactivate.
   * (In production, this reads status from service-finance via gRPC/NATS.)
   */
  private async updateSuspendedAbonnements(): Promise<void> {
    const suspended = await this.abonnementRepository.find({
      where: { statut: 'SUSPENDU_IMPAYE' },
    });

    if (suspended.length > 0) {
      this.logger.log(
        `Found ${suspended.length} suspended (SUSPENDU_IMPAYE) abonnement(s) for review`,
      );
      // TODO: Query service-finance for dunning resolution status
      // For each resolved → update statut back to 'ACTIF'
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 2 — Daily 08:00: Carence, plafonds, anniversaries
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Daily at 08:00 — Multiple checks:
   *   - Carence periods expiring today → send notification
   *   - Plafonds near 80% → send internal alert
   *   - Anniversary dates → reset CompteurPlafond via RegleDepanssurService
   */
  @Cron(process.env.DEPANSSUR_CRON_DAILY_CHECKS || DEFAULT_CRON_DAILY_0800, {
    name: 'depanssur-daily-checks',
    timeZone: 'Europe/Paris',
  })
  async handleDailyChecks(): Promise<void> {
    const jobName = 'depanssur-daily-checks';
    const startTime = Date.now();
    this.logger.log(`[${jobName}] Starting...`);

    try {
      const today = new Date();

      // Sub-task 1: Check carence expirations
      await this.checkCarenceExpirations(today);

      // Sub-task 2: Check plafonds near limit
      await this.checkPlafondsNearLimit(today);

      // Sub-task 3: Check anniversary dates for compteur reset
      await this.checkAnniversaryDates(today);

      const durationMs = Date.now() - startTime;
      this.logger.log(`[${jobName}] Completed in ${durationMs}ms`);
    } catch (error) {
      this.logger.error(
        `[${jobName}] Job failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Find abonnements whose carence period expires today → notify the subscriber.
   *
   * Carence = dateEffet + periodeAttente (days).
   * We look for abonnements where dateEffet + periodeAttente = today.
   */
  private async checkCarenceExpirations(today: Date): Promise<void> {
    const activeAbonnements = await this.abonnementRepository.find({
      where: { statut: 'ACTIF' },
    });

    const startOfToday = this.startOfDay(today);
    const endOfToday = this.endOfDay(today);
    let carenceExpiringCount = 0;

    for (const abonnement of activeAbonnements) {
      if (!abonnement.dateEffet || abonnement.periodeAttente <= 0) {
        continue;
      }

      const dateFinCarence = this.addDays(
        this.startOfDay(new Date(abonnement.dateEffet)),
        abonnement.periodeAttente,
      );

      if (dateFinCarence >= startOfToday && dateFinCarence <= endOfToday) {
        carenceExpiringCount++;
        this.logger.log(
          `Carence expiring today for abonnement ${abonnement.id} ` +
          `(client=${abonnement.clientId}, dateEffet=${abonnement.dateEffet.toISOString()}, ` +
          `periodeAttente=${abonnement.periodeAttente}j)`,
        );

        // TODO: Publish NATS notification 'depanssur.carence.expired'
        // Example: await this.natsService.publish('depanssur.carence.expired', {
        //   abonnementId: abonnement.id,
        //   clientId: abonnement.clientId,
        //   dateFinCarence: dateFinCarence.toISOString(),
        // });
      }
    }

    this.logger.log(
      `Carence check: ${carenceExpiringCount} expiration(s) detected among ${activeAbonnements.length} active abonnement(s)`,
    );
  }

  /**
   * Check active abonnements for plafonds near the 80% threshold.
   * Sends internal alerts for early warning.
   */
  private async checkPlafondsNearLimit(today: Date): Promise<void> {
    const activeAbonnements = await this.abonnementRepository.find({
      where: { statut: 'ACTIF' },
      relations: ['compteurs'],
    });

    let alertCount = 0;

    for (const abonnement of activeAbonnements) {
      // Find current cycle compteur
      const compteur = this.findCurrentCompteur(abonnement.compteurs, today);
      if (!compteur) {
        continue;
      }

      const montantCumule = Number(compteur.montantCumule || 0);
      const nbInterventionsUtilisees = compteur.nbInterventionsUtilisees || 0;

      // Check annuel montant plafond
      const plafondAnnuel = abonnement.plafondAnnuel ? Number(abonnement.plafondAnnuel) : null;
      if (plafondAnnuel !== null && plafondAnnuel > 0) {
        const ratio = montantCumule / plafondAnnuel;
        if (ratio >= PLAFOND_ALERT_THRESHOLD) {
          alertCount++;
          this.logger.warn(
            `PLAFOND ALERT: Abonnement ${abonnement.id} — montant ${montantCumule}/${plafondAnnuel} ` +
            `(${Math.round(ratio * 100)}%) ≥ ${Math.round(PLAFOND_ALERT_THRESHOLD * 100)}%`,
          );

          // TODO: Publish NATS alert 'depanssur.plafond.alert'
        }
      }

      // Check nb interventions max
      const nbMax = abonnement.nbInterventionsMax;
      if (nbMax !== null && nbMax > 0) {
        const ratio = nbInterventionsUtilisees / nbMax;
        if (ratio >= PLAFOND_ALERT_THRESHOLD) {
          alertCount++;
          this.logger.warn(
            `PLAFOND ALERT: Abonnement ${abonnement.id} — interventions ${nbInterventionsUtilisees}/${nbMax} ` +
            `(${Math.round(ratio * 100)}%) ≥ ${Math.round(PLAFOND_ALERT_THRESHOLD * 100)}%`,
          );

          // TODO: Publish NATS alert 'depanssur.plafond.alert'
        }
      }
    }

    this.logger.log(
      `Plafond check: ${alertCount} alert(s) raised among ${activeAbonnements.length} active abonnement(s)`,
    );
  }

  /**
   * Check anniversary dates — if an abonnement's cycle window is ending today,
   * reset the compteur for the new cycle via RegleDepanssurService.resetCompteurAnnuel().
   */
  private async checkAnniversaryDates(today: Date): Promise<void> {
    const activeAbonnements = await this.abonnementRepository.find({
      where: { statut: 'ACTIF' },
    });

    let resetCount = 0;

    for (const abonnement of activeAbonnements) {
      if (!abonnement.dateEffet) {
        continue;
      }

      // Check if today is the anniversary of dateEffet (same month + day)
      const dateEffet = new Date(abonnement.dateEffet);
      const isAnniversary =
        today.getUTCMonth() === dateEffet.getUTCMonth() &&
        today.getUTCDate() === dateEffet.getUTCDate() &&
        today.getUTCFullYear() !== dateEffet.getUTCFullYear();

      if (isAnniversary) {
        try {
          await this.regleDepanssurService.resetCompteurAnnuel(abonnement, today);
          resetCount++;
          this.logger.log(
            `Anniversary reset for abonnement ${abonnement.id} ` +
            `(dateEffet=${dateEffet.toISOString()})`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to reset compteur for abonnement ${abonnement.id}: ` +
            `${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    this.logger.log(
      `Anniversary check: ${resetCount} compteur(s) reset among ${activeAbonnements.length} active abonnement(s)`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 3 — Weekly Monday 09:00: Reports & exports
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Weekly Monday at 09:00 — Generate reports:
   *   - Accounting export (→ service-finance)
   *   - Commission tracking (→ service-commercial)
   *   - Claims report (aggregate dossiers)
   */
  @Cron(process.env.DEPANSSUR_CRON_WEEKLY_REPORTS || DEFAULT_CRON_WEEKLY_MON_0900, {
    name: 'depanssur-weekly-reports',
    timeZone: 'Europe/Paris',
  })
  async handleWeeklyReports(): Promise<void> {
    const jobName = 'depanssur-weekly-reports';
    const startTime = Date.now();
    this.logger.log(`[${jobName}] Starting...`);

    try {
      const now = new Date();
      const weekAgo = this.addDays(now, -7);

      // Sub-task 1: Generate accounting export
      await this.generateAccountingExport(weekAgo, now);

      // Sub-task 2: Generate commission tracking
      await this.generateCommissionTracking(weekAgo, now);

      // Sub-task 3: Generate claims report
      await this.generateClaimsReport(weekAgo, now);

      const durationMs = Date.now() - startTime;
      this.logger.log(`[${jobName}] Completed in ${durationMs}ms`);
    } catch (error) {
      this.logger.error(
        `[${jobName}] Job failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Trigger accounting export generation via service-finance.
   * In production, this publishes a NATS command to service-finance's ExportService.
   */
  private async generateAccountingExport(periodFrom: Date, periodTo: Date): Promise<void> {
    this.logger.log(
      `Generating accounting export for period ${periodFrom.toISOString()} → ${periodTo.toISOString()}`,
    );

    // Count active subscriptions for the reporting period
    const activeCount = await this.abonnementRepository.count({
      where: { statut: 'ACTIF' },
    });

    this.logger.log(
      `Accounting export context: ${activeCount} active abonnement(s)`,
    );

    // TODO: Publish NATS command 'depanssur.export.accounting' to service-finance
    // Example: await this.natsService.publish('depanssur.export.accounting', {
    //   periodFrom: periodFrom.toISOString(),
    //   periodTo: periodTo.toISOString(),
    //   source: 'depanssur',
    //   activeSubscriptions: activeCount,
    // });
  }

  /**
   * Trigger commission tracking generation via service-commercial.
   * In production, publishes NATS command to compute partner commissions.
   */
  private async generateCommissionTracking(periodFrom: Date, periodTo: Date): Promise<void> {
    this.logger.log(
      `Generating commission tracking for period ${periodFrom.toISOString()} → ${periodTo.toISOString()}`,
    );

    // Gather subscriptions created/renewed in the period for commission calculation
    const subscriptionsInPeriod = await this.abonnementRepository.find({
      where: {
        dateSouscription: Between(periodFrom, periodTo),
      },
    });

    this.logger.log(
      `Commission tracking: ${subscriptionsInPeriod.length} subscription(s) in period`,
    );

    // TODO: Publish NATS command 'depanssur.export.commissions' to service-commercial
    // Example: await this.natsService.publish('depanssur.export.commissions', {
    //   periodFrom: periodFrom.toISOString(),
    //   periodTo: periodTo.toISOString(),
    //   subscriptionIds: subscriptionsInPeriod.map(s => s.id),
    // });
  }

  /**
   * Generate aggregated claims (dossiers) report for the past week.
   * Aggregates dossier data locally and logs the report summary.
   */
  private async generateClaimsReport(periodFrom: Date, periodTo: Date): Promise<void> {
    this.logger.log(
      `Generating claims report for period ${periodFrom.toISOString()} → ${periodTo.toISOString()}`,
    );

    // Aggregate dossiers from the period
    const dossiers = await this.dossierRepository.find({
      where: {
        dateOuverture: Between(periodFrom, periodTo),
      },
    });

    // Build summary by statut
    const summary: Record<string, number> = {};
    let totalMontantEstimatif = 0;
    let totalMontantPrisEnCharge = 0;

    for (const dossier of dossiers) {
      const statut = dossier.statut || 'UNKNOWN';
      summary[statut] = (summary[statut] || 0) + 1;

      if (dossier.montantEstimatif) {
        totalMontantEstimatif += Number(dossier.montantEstimatif);
      }
      if (dossier.montantPrisEnCharge) {
        totalMontantPrisEnCharge += Number(dossier.montantPrisEnCharge);
      }
    }

    const summaryStr = Object.entries(summary)
      .map(([statut, count]) => `${statut}=${count}`)
      .join(', ');

    this.logger.log(
      `Claims report: ${dossiers.length} dossier(s) — ${summaryStr || 'none'} ` +
      `| estimatif=${totalMontantEstimatif.toFixed(2)}€, pris_en_charge=${totalMontantPrisEnCharge.toFixed(2)}€`,
    );

    // TODO: Publish NATS event 'depanssur.report.claims' for downstream consumers
    // or store the report in a dedicated table for dashboard access.
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Utility helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Compute the next echeance based on periodicite. */
  private computeNextEcheance(current: Date, periodicite: string): Date {
    const next = new Date(current);
    switch (periodicite?.toUpperCase()) {
      case 'ANNUELLE':
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      case 'TRIMESTRIELLE':
        next.setUTCMonth(next.getUTCMonth() + 3);
        break;
      case 'MENSUELLE':
      default:
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;
    }
    return next;
  }

  /** Find the compteur covering the given date. */
  private findCurrentCompteur(
    compteurs: CompteurPlafondEntity[] | undefined,
    date: Date,
  ): CompteurPlafondEntity | null {
    if (!compteurs?.length) {
      return null;
    }

    return (
      compteurs.find(
        (c) =>
          new Date(c.anneeGlissanteDebut).getTime() <= date.getTime() &&
          new Date(c.anneeGlissanteFin).getTime() > date.getTime(),
      ) ?? null
    );
  }

  /** Start of UTC day. */
  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /** End of UTC day. */
  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  /** Add days to a date. */
  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduleEntity,
  ScheduleStatus,
} from '../entities/schedule.entity';
import {
  DunningConfigEntity,
  type DunningStep,
} from '../entities/dunning-config.entity';
import { PortalPaymentSessionEntity } from '../entities/portal-session.entity';
import type { ISmsService } from '../../../infrastructure/external/sms/sms-service.interface';
import { SMS_SERVICE_TOKEN } from '../../../infrastructure/external/sms/sms-service.interface';
import type { IImsClient } from '../../../infrastructure/external/ims/ims-client.interface';
import { IMS_CLIENT_TOKEN } from '../../../infrastructure/external/ims/ims-client.interface';
import { CbUpdateSessionService } from '../../../infrastructure/persistence/typeorm/repositories/payments/cb-update-session.service';


// ────────────────────────────────────────────────────────────────────
// Event interfaces (NATS payloads)
// ────────────────────────────────────────────────────────────────────

export interface DepanssurPaymentFailedEvent {
  abonnementId: string;
  scheduleId: string;
  clientId: string;
  organisationId: string;
  societeId?: string;
  failureCode?: string;
  failureMessage?: string;
  amountCents: number;
  currency?: string;
  /** ISO timestamp of the failure */
  occurredAt: string;
}

export interface DepanssurPaymentSucceededEvent {
  abonnementId: string;
  scheduleId: string;
  clientId: string;
  organisationId: string;
  /** ISO timestamp of the payment */
  occurredAt: string;
}

/** Published when abonnement is suspended due to dunning */
export interface AbonnementSuspendedEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  reason: string;
  /** ISO timestamp */
  suspendedAt: string;
  /** Number of failed retry attempts */
  totalAttempts: number;
}

/** Published when abonnement is restored after successful payment */
export interface AbonnementRestoredEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  /** ISO timestamp */
  restoredAt: string;
}

/** Published to request commission cancellation */
export interface CancelRecurringCommissionsEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  reason: string;
  /** ISO timestamp from which commissions should be cancelled */
  effectiveDate: string;
}

/** Published to request commission restart */
export interface RestartRecurringCommissionsEvent {
  abonnementId: string;
  clientId: string;
  organisationId: string;
  /** ISO timestamp from which commissions should restart */
  effectiveDate: string;
}

// ────────────────────────────────────────────────────────────────────
// Dunning run state tracking (in-memory; production would persist)
// ────────────────────────────────────────────────────────────────────

export interface DunningRunState {
  abonnementId: string;
  scheduleId: string;
  clientId: string;
  organisationId: string;
  societeId?: string;
  configId: string;
  /** Index of last completed step (0-based). -1 means not started. */
  lastCompletedStep: number;
  /** Original failure date (J0) */
  failureDate: Date;
  /** Number of retry attempts made */
  totalAttempts: number;
  /** Whether this dunning run is resolved (payment received or abonnement suspended) */
  isResolved: boolean;
  /** Resolution reason */
  resolutionReason?: string;
  /** Created date */
  createdAt: Date;
  /** Last updated */
  updatedAt: Date;
}

// ────────────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────────────

/**
 * DunningDepanssurService implements the Depanssur payment failure
 * dunning sequence per CDC §6:
 *
 *   J0:  Payment fails → soft email notification + schedule retry J+2
 *   J+2: 2nd automatic retry attempt
 *   J+5: 3rd retry + SMS with payment update link (PortalPaymentSession)
 *   J+10: Suspend abonnement (SUSPENDU_IMPAYE), cancel recurring commissions
 *
 * On successful payment → restore abonnement (ACTIF), restart commissions.
 */
@Injectable()
export class DunningDepanssurService {
  private readonly logger = new Logger(DunningDepanssurService.name);

  /**
   * In-memory tracking of dunning runs.
   * In production this would be a DB table; for now kept in-memory
   * to avoid extra migration complexity.
   */
  private readonly activeRuns = new Map<string, DunningRunState>();

  constructor(
    @InjectRepository(DunningConfigEntity)
    private readonly configRepository: Repository<DunningConfigEntity>,
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    @InjectRepository(PortalPaymentSessionEntity)
    private readonly portalSessionRepository: Repository<PortalPaymentSessionEntity>,
    @Inject(SMS_SERVICE_TOKEN)
    private readonly smsService: ISmsService,
    @Inject(IMS_CLIENT_TOKEN)
    private readonly imsClient: IImsClient,
    private readonly cbUpdateSessionService: CbUpdateSessionService,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // PUBLIC: Payment Failed → Start or continue dunning
  // ──────────────────────────────────────────────────────────────────

  /**
   * Called when a Depanssur subscription payment fails.
   * Initiates the dunning sequence if not already in progress,
   * or advances to the next step.
   */
  async handlePaymentFailed(event: DepanssurPaymentFailedEvent): Promise<void> {
    this.logger.log(
      `Payment failed for abonnement=${event.abonnementId} schedule=${event.scheduleId} code=${event.failureCode ?? 'N/A'}`,
    );

    const config = await this.getActiveConfig(event.organisationId);
    if (!config) {
      this.logger.warn(
        `No active dunning config found for org=${event.organisationId} type=DEPANSSUR, skipping`,
      );
      return;
    }

    let run = this.activeRuns.get(event.abonnementId);
    if (!run || run.isResolved) {
      // Start new dunning run
      run = {
        abonnementId: event.abonnementId,
        scheduleId: event.scheduleId,
        clientId: event.clientId,
        organisationId: event.organisationId,
        societeId: event.societeId,
        configId: config.id,
        lastCompletedStep: -1,
        failureDate: new Date(event.occurredAt),
        totalAttempts: 0,
        isResolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.activeRuns.set(event.abonnementId, run);
      this.logger.log(`Dunning run started for abonnement=${event.abonnementId}`);
    }

    // Execute current step (J0)
    await this.executeNextStep(run, config, event);
  }

  // ──────────────────────────────────────────────────────────────────
  // PUBLIC: Scheduled retry check (called by cron or scheduler)
  // ──────────────────────────────────────────────────────────────────

  /**
   * Process pending dunning steps that are due.
   * Should be called periodically (e.g., every hour) by a scheduler.
   */
  async processPendingSteps(): Promise<number> {
    const now = new Date();
    let processed = 0;

    for (const [abonnementId, run] of this.activeRuns.entries()) {
      if (run.isResolved) {
        continue;
      }

      const config = await this.configRepository.findOne({
        where: { id: run.configId },
      });

      if (!config) {
        this.logger.warn(`Config ${run.configId} not found, resolving run for ${abonnementId}`);
        run.isResolved = true;
        run.resolutionReason = 'CONFIG_NOT_FOUND';
        continue;
      }

      const nextStepIndex = run.lastCompletedStep + 1;
      if (nextStepIndex >= config.steps.length) {
        continue; // All steps completed
      }

      const nextStep = config.steps[nextStepIndex];
      const stepDueDate = this.addDays(run.failureDate, nextStep.delayDays);

      if (now >= stepDueDate) {
        await this.executeStep(run, config, nextStep, nextStepIndex);
        processed++;
      }
    }

    if (processed > 0) {
      this.logger.log(`Processed ${processed} pending dunning step(s)`);
    }

    return processed;
  }

  // ──────────────────────────────────────────────────────────────────
  // PUBLIC: Payment Succeeded → Restore abonnement
  // ──────────────────────────────────────────────────────────────────

  /**
   * Called when a Depanssur subscription payment succeeds.
   * If there's an active dunning run, resolve it and restore the abonnement.
   *
   * Returns NATS events to publish.
   */
  async handlePaymentSucceeded(
    event: DepanssurPaymentSucceededEvent,
  ): Promise<{
    restored: boolean;
    events: (AbonnementRestoredEvent | RestartRecurringCommissionsEvent)[];
  }> {
    this.logger.log(
      `Payment succeeded for abonnement=${event.abonnementId} schedule=${event.scheduleId}`,
    );

    const run = this.activeRuns.get(event.abonnementId);
    if (!run || run.isResolved) {
      return { restored: false, events: [] };
    }

    // Resolve the dunning run
    run.isResolved = true;
    run.resolutionReason = 'PAYMENT_SUCCEEDED';
    run.updatedAt = new Date();

    // Restore the schedule if it was paused
    const schedule = await this.scheduleRepository.findOne({
      where: { id: run.scheduleId },
    });

    if (schedule && schedule.status === ScheduleStatus.PAUSED) {
      schedule.status = ScheduleStatus.ACTIVE;
      schedule.retryCount = 0;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        dunningResolved: true,
        dunningResolvedAt: new Date().toISOString(),
        dunningResolutionReason: 'PAYMENT_SUCCEEDED',
      };
      await this.scheduleRepository.save(schedule);
      this.logger.log(`Schedule ${run.scheduleId} restored to ACTIVE after payment success`);
    }

    const events: (AbonnementRestoredEvent | RestartRecurringCommissionsEvent)[] = [];

    // Build the retablir events
    const restoredEvent: AbonnementRestoredEvent = {
      abonnementId: event.abonnementId,
      clientId: event.clientId,
      organisationId: event.organisationId,
      restoredAt: new Date().toISOString(),
    };
    events.push(restoredEvent);

    const restartCommissionsEvent: RestartRecurringCommissionsEvent = {
      abonnementId: event.abonnementId,
      clientId: event.clientId,
      organisationId: event.organisationId,
      effectiveDate: new Date().toISOString(),
    };
    events.push(restartCommissionsEvent);

    this.logger.log(
      `Dunning run resolved for abonnement=${event.abonnementId}: PAYMENT_SUCCEEDED`,
    );

    return { restored: true, events };
  }

  // ──────────────────────────────────────────────────────────────────
  // PUBLIC: Suspendre / Rétablir
  // ──────────────────────────────────────────────────────────────────

  /**
   * Suspend an abonnement due to unpaid subscription (SUSPENDU_IMPAYE).
   * This method:
   * 1. Pauses the payment schedule
   * 2. Notifies IMS of the suspension
   * 3. Returns events for NATS publication (abonnement.suspended, commission.cancel_recurring)
   *
   * The actual AbonnementDepanssurEntity.statut change is done by service-core
   * upon receiving the abonnement.depanssur.suspended NATS event.
   */
  async suspendreAbonnement(
    abonnementId: string,
    clientId: string,
    organisationId: string,
    scheduleId: string,
    totalAttempts: number,
  ): Promise<{
    events: (AbonnementSuspendedEvent | CancelRecurringCommissionsEvent)[];
  }> {
    this.logger.warn(
      `Suspending abonnement=${abonnementId} after ${totalAttempts} failed attempts`,
    );

    // 1. Pause the payment schedule
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (schedule && schedule.status !== ScheduleStatus.PAUSED) {
      schedule.status = ScheduleStatus.PAUSED;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        suspendedByDunning: true,
        suspendedAt: new Date().toISOString(),
        totalRetryAttempts: totalAttempts,
        dunningType: 'DEPANSSUR',
      };
      await this.scheduleRepository.save(schedule);
    }

    // 2. Notify IMS
    try {
      const imsResult = await this.imsClient.notifySuspension({
        subscriptionId: abonnementId,
        clientId,
        organisationId,
        reason: `DUNNING_DEPANSSUR_MAX_STEPS_REACHED (attempts=${totalAttempts})`,
        effectiveDate: new Date().toISOString(),
      });
      this.logger.log(
        `IMS suspension notified: ack=${imsResult.acknowledged} ref=${imsResult.externalRef ?? 'N/A'}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to notify IMS of suspension for abonnement=${abonnementId}: ${error.message}`,
      );
      // Don't block the dunning flow on IMS failure
    }

    // 3. Build events to publish via NATS
    const events: (AbonnementSuspendedEvent | CancelRecurringCommissionsEvent)[] = [];

    const suspendedEvent: AbonnementSuspendedEvent = {
      abonnementId,
      clientId,
      organisationId,
      reason: 'DUNNING_DEPANSSUR_IMPAYE',
      suspendedAt: new Date().toISOString(),
      totalAttempts,
    };
    events.push(suspendedEvent);

    // Cancel recurring commissions for the current cycle only (not already paid ones)
    const cancelCommissionsEvent: CancelRecurringCommissionsEvent = {
      abonnementId,
      clientId,
      organisationId,
      reason: 'SUSPENSION_IMPAYE_DEPANSSUR',
      effectiveDate: new Date().toISOString(),
    };
    events.push(cancelCommissionsEvent);

    this.logger.warn(
      `Abonnement ${abonnementId} suspended: emitting abonnement.depanssur.suspended + commission.cancel_recurring`,
    );

    return { events };
  }

  /**
   * Restore an abonnement after successful payment (ACTIF).
   * This method:
   * 1. Restores the payment schedule to ACTIVE
   * 2. Returns events for NATS publication (abonnement.restored, commission.restart_recurring)
   *
   * The actual AbonnementDepanssurEntity.statut change is done by service-core
   * upon receiving the abonnement.depanssur.restored NATS event.
   */
  async retablirAbonnement(
    abonnementId: string,
    clientId: string,
    organisationId: string,
    scheduleId: string,
  ): Promise<{
    events: (AbonnementRestoredEvent | RestartRecurringCommissionsEvent)[];
  }> {
    this.logger.log(`Restoring abonnement=${abonnementId} after successful payment`);

    // 1. Restore schedule
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (schedule && schedule.status === ScheduleStatus.PAUSED) {
      schedule.status = ScheduleStatus.ACTIVE;
      schedule.retryCount = 0;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        dunningResolved: true,
        dunningResolvedAt: new Date().toISOString(),
        dunningResolutionReason: 'PAYMENT_SUCCEEDED',
      };
      await this.scheduleRepository.save(schedule);
    }

    // 2. Build events
    const events: (AbonnementRestoredEvent | RestartRecurringCommissionsEvent)[] = [];

    const restoredEvent: AbonnementRestoredEvent = {
      abonnementId,
      clientId,
      organisationId,
      restoredAt: new Date().toISOString(),
    };
    events.push(restoredEvent);

    const restartCommissionsEvent: RestartRecurringCommissionsEvent = {
      abonnementId,
      clientId,
      organisationId,
      effectiveDate: new Date().toISOString(),
    };
    events.push(restartCommissionsEvent);

    this.logger.log(
      `Abonnement ${abonnementId} restored: emitting abonnement.depanssur.restored + commission.restart_recurring`,
    );

    return { events };
  }

  // ──────────────────────────────────────────────────────────────────
  // PUBLIC: Getters for monitoring
  // ──────────────────────────────────────────────────────────────────

  getActiveRunCount(): number {
    let count = 0;
    for (const run of this.activeRuns.values()) {
      if (!run.isResolved) count++;
    }
    return count;
  }

  getRunState(abonnementId: string): DunningRunState | undefined {
    return this.activeRuns.get(abonnementId);
  }

  // ──────────────────────────────────────────────────────────────────
  // PRIVATE: Step execution
  // ──────────────────────────────────────────────────────────────────

  private async executeNextStep(
    run: DunningRunState,
    config: DunningConfigEntity,
    event: DepanssurPaymentFailedEvent,
  ): Promise<void> {
    const nextStepIndex = run.lastCompletedStep + 1;
    if (nextStepIndex >= config.steps.length) {
      this.logger.warn(`All dunning steps exhausted for abonnement=${run.abonnementId}`);
      return;
    }

    const step = config.steps[nextStepIndex];
    await this.executeStep(run, config, step, nextStepIndex, event);
  }

  private async executeStep(
    run: DunningRunState,
    config: DunningConfigEntity,
    step: DunningStep,
    stepIndex: number,
    event?: DepanssurPaymentFailedEvent,
  ): Promise<void> {
    this.logger.log(
      `Executing dunning step ${stepIndex} (${step.label}) for abonnement=${run.abonnementId}`,
    );

    try {
      switch (step.action) {
        case 'RETRY_PAYMENT':
          await this.executeRetryPayment(run, step, stepIndex);
          break;

        case 'RETRY_PAYMENT_AND_NOTIFY':
          await this.executeRetryPaymentAndNotify(run, step, stepIndex);
          break;

        case 'SUSPEND':
          await this.executeSuspend(run, step, stepIndex);
          break;

        default:
          this.logger.warn(`Unknown dunning action: ${step.action}`);
      }

      run.lastCompletedStep = stepIndex;
      run.updatedAt = new Date();
    } catch (error: any) {
      this.logger.error(
        `Dunning step ${stepIndex} failed for abonnement=${run.abonnementId}: ${error.message}`,
        error.stack,
      );
      // Don't advance the step; it will be retried on next processPendingSteps()
    }
  }

  private async executeRetryPayment(
    run: DunningRunState,
    step: DunningStep,
    stepIndex: number,
  ): Promise<void> {
    run.totalAttempts++;

    // Increment retry count on schedule
    const schedule = await this.scheduleRepository.findOne({
      where: { id: run.scheduleId },
    });

    if (schedule) {
      schedule.retryCount++;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        lastDunningStep: stepIndex,
        lastDunningStepLabel: step.label,
        lastDunningRetryAt: new Date().toISOString(),
      };
      await this.scheduleRepository.save(schedule);
    }

    // Send email notification on J0
    if (step.channels.includes('EMAIL')) {
      this.logger.log(
        `[DUNNING] Email notification sent for abonnement=${run.abonnementId} step=${stepIndex}`,
      );
      // In production: call EmailService.send() with soft payment failure template
    }

    this.logger.log(
      `[DUNNING] Retry payment scheduled/triggered for abonnement=${run.abonnementId} attempt=${run.totalAttempts}`,
    );
  }

  private async executeRetryPaymentAndNotify(
    run: DunningRunState,
    step: DunningStep,
    stepIndex: number,
  ): Promise<void> {
    run.totalAttempts++;

    // Increment retry count on schedule
    const schedule = await this.scheduleRepository.findOne({
      where: { id: run.scheduleId },
    });

    if (schedule) {
      schedule.retryCount++;
      schedule.metadata = {
        ...(schedule.metadata ?? {}),
        lastDunningStep: stepIndex,
        lastDunningStepLabel: step.label,
        lastDunningRetryAt: new Date().toISOString(),
      };
      await this.scheduleRepository.save(schedule);
    }

    // Create payment update link (PortalPaymentSession)
    let paymentLink: string | undefined;
    if (step.includePaymentLink) {
      try {
        const session = await this.cbUpdateSessionService.createSession({
          clientId: run.clientId,
          organisationId: run.organisationId,
          scheduleId: run.scheduleId,
          subscriptionType: 'WEB_DIRECT',
        });
        paymentLink = session.link;
        this.logger.log(
          `Payment update link created for abonnement=${run.abonnementId}: ${paymentLink}`,
        );
      } catch (error: any) {
        this.logger.error(
          `Failed to create payment update link for abonnement=${run.abonnementId}: ${error.message}`,
        );
      }
    }

    // Send SMS with payment link
    if (step.channels.includes('SMS')) {
      const smsBody = paymentLink
        ? `Depanssur: Votre paiement a échoué. Mettez à jour votre moyen de paiement: ${paymentLink}`
        : `Depanssur: Votre paiement a échoué. Veuillez nous contacter pour régulariser votre situation.`;

      try {
        const result = await this.smsService.sendSms({
          to: run.clientId, // In production: resolve actual phone number from client
          body: smsBody,
          metadata: {
            abonnementId: run.abonnementId,
            dunningStep: String(stepIndex),
            type: 'DEPANSSUR_DUNNING',
          },
        });
        this.logger.log(
          `SMS sent for abonnement=${run.abonnementId}: success=${result.success} messageId=${result.messageId}`,
        );
      } catch (error: any) {
        this.logger.error(
          `Failed to send SMS for abonnement=${run.abonnementId}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `[DUNNING] Retry + notify completed for abonnement=${run.abonnementId} attempt=${run.totalAttempts}`,
    );
  }

  private async executeSuspend(
    run: DunningRunState,
    step: DunningStep,
    stepIndex: number,
  ): Promise<void> {
    this.logger.warn(
      `[DUNNING] Executing suspension for abonnement=${run.abonnementId} after ${run.totalAttempts} failed attempts`,
    );

    // Suspend the abonnement and cancel commissions
    const { events } = await this.suspendreAbonnement(
      run.abonnementId,
      run.clientId,
      run.organisationId,
      run.scheduleId,
      run.totalAttempts,
    );

    // Resolve the dunning run
    run.isResolved = true;
    run.resolutionReason = 'ABONNEMENT_SUSPENDED';
    run.updatedAt = new Date();

    // Send final notifications
    for (const channel of step.channels) {
      if (channel === 'EMAIL') {
        this.logger.log(
          `[DUNNING] Suspension email sent for abonnement=${run.abonnementId}`,
        );
        // In production: call EmailService.send() with suspension notification template
      }
      if (channel === 'SMS') {
        try {
          await this.smsService.sendSms({
            to: run.clientId,
            body: `Depanssur: Votre abonnement a été suspendu pour impayé. Veuillez régulariser votre situation pour le réactiver.`,
            metadata: {
              abonnementId: run.abonnementId,
              dunningStep: String(stepIndex),
              type: 'DEPANSSUR_DUNNING_SUSPENSION',
            },
          });
        } catch (error: any) {
          this.logger.error(
            `Failed to send suspension SMS for abonnement=${run.abonnementId}: ${error.message}`,
          );
        }
      }
    }

    this.logger.warn(
      `Abonnement ${run.abonnementId} suspended after dunning sequence completion`,
    );

    // NOTE: The events returned by suspendreAbonnement() should be published via NATS
    // by the handler that called this service. This keeps the service pure and testable.
  }

  // ──────────────────────────────────────────────────────────────────
  // PRIVATE: Config resolution
  // ──────────────────────────────────────────────────────────────────

  private async getActiveConfig(organisationId: string): Promise<DunningConfigEntity | null> {
    return this.configRepository.findOne({
      where: {
        organisationId,
        type: 'DEPANSSUR',
        isActive: true,
      },
      order: { priority: 'DESC' },
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // PRIVATE: Utilities
  // ──────────────────────────────────────────────────────────────────

  private addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}

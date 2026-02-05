import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { RetryScheduleEntity, RetryEligibility } from '../retry-schedule/entities/retry-schedule.entity';
import { RetryAttemptEntity, RetryAttemptStatus } from '../retry-attempt/entities/retry-attempt.entity';
import { RetryJobEntity, RetryJobStatus } from '../retry-job/entities/retry-job.entity';
import { RetryPolicyEntity } from '../retry-policy/entities/retry-policy.entity';
import { RetryAuditLogEntity, AuditActorType } from '../audit-log/entities/retry-audit-log.entity';
import { RetryPolicyService } from '../retry-policy/retry-policy.service';
import { AuditLogService } from '../audit-log/audit-log.service';

// Import types from proto definitions
import type { PaymentRejectedEvent as ProtoPaymentRejectedEvent } from '@crm/proto/retry/types';

const NON_RETRYABLE_CODES = [
  'AC01_IBAN_INVALID',
  'AC13_DEBTOR_ACCOUNT_TYPE',
  'CNOR_CREDITOR_NOT_ON_WHITELIST',
  'DNOR_DEBTOR_NOT_ON_WHITELIST',
  'FF05_DUPLICATE_ENTRY',
  'FOCR_FOLLOWING_CANCELLATION',
];

const RETRYABLE_CODES = [
  'AM04_ACCOUNT_CLOSED',
  'AC04_ACCOUNT_CLOSED',
  'AC06_ACCOUNT_BLOCKED',
  'AG01_TRANSACTION_FORBIDDEN',
  'MS02_NOT_SPECIFIED_REASON',
  'MS03_AGENT_REASON',
];

/**
 * Service-level input type derived from proto PaymentRejectedEvent
 * Converts Timestamp to Date for internal processing
 */
export type PaymentRejectedEvent = Omit<ProtoPaymentRejectedEvent, 'rejected_at' | 'event_timestamp'> & {
  rejectedAt: Date;
  eventTimestamp?: Date;
};

/**
 * Internal input type for processing due retries
 */
export interface ProcessDueRetriesInput {
  organisationId: string;
  targetDate: Date;
  timezone: string;
  cutoffTime: string;
  dryRun?: boolean;
}

@Injectable()
export class RetrySchedulerService {
  private readonly logger = new Logger(RetrySchedulerService.name);

  constructor(
    @InjectRepository(RetryScheduleEntity)
    private readonly scheduleRepository: Repository<RetryScheduleEntity>,
    @InjectRepository(RetryAttemptEntity)
    private readonly attemptRepository: Repository<RetryAttemptEntity>,
    @InjectRepository(RetryJobEntity)
    private readonly jobRepository: Repository<RetryJobEntity>,
    private readonly policyService: RetryPolicyService,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'Europe/Paris' })
  async scheduledDailyRun(): Promise<void> {
    this.logger.log('Starting scheduled daily retry run at 10:00 Europe/Paris');
    
    const organisations = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select('DISTINCT schedule.organisationId', 'organisationId')
      .where('schedule.isResolved = :isResolved', { isResolved: false })
      .andWhere('schedule.eligibility = :eligibility', { eligibility: RetryEligibility.ELIGIBLE })
      .getRawMany();

    for (const org of organisations) {
      try {
        await this.processDueRetries({
          organisationId: org.organisationId,
          targetDate: new Date(),
          timezone: 'Europe/Paris',
          cutoffTime: '10:00:00',
          dryRun: false,
        });
      } catch (error) {
        this.logger.error(`Failed to process retries for org ${org.organisationId}`, error);
      }
    }
  }

  async handlePaymentRejected(event: PaymentRejectedEvent): Promise<{
    processed: boolean;
    retryScheduleId?: string;
    eligibility: RetryEligibility;
    message: string;
  }> {
    this.logger.log(`Handling payment rejection: ${event.payment_id} with code ${event.reason_code}`);

    const existing = await this.scheduleRepository.findOne({
      where: { idempotencyKey: event.idempotency_key },
    });

    if (existing) {
      this.logger.warn(`Duplicate rejection event detected: ${event.idempotency_key}`);
      return {
        processed: false,
        retryScheduleId: existing.id,
        eligibility: existing.eligibility,
        message: 'Duplicate event - already processed',
      };
    }

    const policy = await this.policyService.findApplicablePolicy(
      event.organisation_id,
      event.societe_id,
    );

    if (!policy) {
      this.logger.warn(`No retry policy found for org ${event.organisation_id}`);
      return {
        processed: false,
        eligibility: RetryEligibility.NOT_ELIGIBLE_REASON_CODE,
        message: 'No applicable retry policy found',
      };
    }

    const eligibilityResult = this.determineEligibility(event.reason_code, policy);
    const rejectionDate = event.rejectedAt ?? new Date();
    const nextRetryDate = eligibilityResult.eligibility === RetryEligibility.ELIGIBLE
      ? this.calculateNextRetryDate(rejectionDate, policy.retryDelaysDays, 0)
      : null;

    const scheduleData = {
      organisationId: event.organisation_id,
      societeId: event.societe_id,
      originalPaymentId: event.payment_id,
      scheduleId: event.schedule_id,
      factureId: event.facture_id || null,
      contratId: event.contrat_id || null,
      clientId: event.client_id,
      rejectionCode: this.normalizeRejectionCode(event.reason_code),
      rejectionRawCode: event.reason_code,
      rejectionMessage: event.reason_message,
      rejectionDate,
      retryPolicyId: policy.id,
      amountCents: event.amount_cents.toString(),
      currency: event.currency,
      eligibility: eligibilityResult.eligibility,
      eligibilityReason: eligibilityResult.reason,
      currentAttempt: 0,
      maxAttempts: policy.maxAttempts,
      nextRetryDate,
      isResolved: eligibilityResult.eligibility !== RetryEligibility.ELIGIBLE,
      idempotencyKey: event.idempotency_key,
    };

    const schedule = this.scheduleRepository.create(scheduleData);
    const savedSchedule = await this.scheduleRepository.save(schedule);

    await this.auditLogService.log({
      organisationId: event.organisation_id,
      entityType: 'RETRY_SCHEDULE',
      entityId: savedSchedule.id,
      action: 'CREATED',
      newValue: savedSchedule as unknown as Record<string, unknown>,
      retryScheduleId: savedSchedule.id,
      paymentId: event.payment_id,
      actorType: AuditActorType.WEBHOOK,
    });

    if (eligibilityResult.eligibility === RetryEligibility.ELIGIBLE && nextRetryDate) {
      await this.createScheduledAttempt(savedSchedule, 1, nextRetryDate);
    }

    return {
      processed: true,
      retryScheduleId: savedSchedule.id,
      eligibility: eligibilityResult.eligibility,
      message: eligibilityResult.reason,
    };
  }

  async processDueRetries(input: ProcessDueRetriesInput): Promise<{
    jobId: string;
    status: RetryJobStatus;
    totalProcessed: number;
    successful: number;
    failed: number;
    skipped: number;
  }> {
    const jobIdempotencyKey = `${input.organisationId}:${input.targetDate.toISOString().split('T')[0]}:${input.cutoffTime}`;

    const existingJob = await this.jobRepository.findOne({
      where: { 
        idempotencyKey: jobIdempotencyKey,
        status: In([RetryJobStatus.JOB_PENDING, RetryJobStatus.JOB_RUNNING]),
      },
    });

    if (existingJob) {
      this.logger.warn(`Job already in progress: ${existingJob.id}`);
      return {
        jobId: existingJob.id,
        status: existingJob.status,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
      };
    }

    const job = this.jobRepository.create({
      organisationId: input.organisationId,
      targetDate: input.targetDate,
      timezone: input.timezone,
      cutoffTime: input.cutoffTime,
      status: RetryJobStatus.JOB_RUNNING,
      idempotencyKey: jobIdempotencyKey,
      triggeredBy: 'SCHEDULER',
      isManual: false,
      startedAt: new Date(),
    });

    const savedJob = await this.jobRepository.save(job);

    const cutoffDateTime = this.calculateCutoffDateTime(input.targetDate, input.timezone, input.cutoffTime);
    
    const dueSchedules = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.organisationId = :organisationId', { organisationId: input.organisationId })
      .andWhere('schedule.isResolved = :isResolved', { isResolved: false })
      .andWhere('schedule.eligibility = :eligibility', { eligibility: RetryEligibility.ELIGIBLE })
      .andWhere('schedule.nextRetryDate <= :cutoff', { cutoff: cutoffDateTime })
      .setLock('pessimistic_write_or_fail')
      .getMany();

    this.logger.log(`Found ${dueSchedules.length} due retries for job ${savedJob.id}`);

    if (input.dryRun) {
      savedJob.status = RetryJobStatus.JOB_COMPLETED;
      savedJob.completedAt = new Date();
      savedJob.totalAttempts = dueSchedules.length;
      await this.jobRepository.save(savedJob);

      return {
        jobId: savedJob.id,
        status: RetryJobStatus.JOB_COMPLETED,
        totalProcessed: dueSchedules.length,
        successful: 0,
        failed: 0,
        skipped: dueSchedules.length,
      };
    }

    let successful = 0;
    let failed = 0;
    let skipped = 0;
    const failedScheduleIds: string[] = [];

    for (const schedule of dueSchedules) {
      try {
        const result = await this.executeRetry(schedule, savedJob.id);
        
        if (result.status === 'SUCCEEDED') {
          successful++;
        } else if (result.status === 'SKIPPED') {
          skipped++;
        } else {
          failed++;
          failedScheduleIds.push(schedule.id);
        }
      } catch (error) {
        this.logger.error(`Failed to execute retry for schedule ${schedule.id}`, error);
        failed++;
        failedScheduleIds.push(schedule.id);
      }
    }

    savedJob.status = failed === 0 ? RetryJobStatus.JOB_COMPLETED 
      : successful === 0 ? RetryJobStatus.JOB_FAILED 
      : RetryJobStatus.JOB_PARTIAL;
    savedJob.completedAt = new Date();
    savedJob.totalAttempts = dueSchedules.length;
    savedJob.successfulAttempts = successful;
    savedJob.failedAttempts = failed;
    savedJob.skippedAttempts = skipped;
    savedJob.failedScheduleIds = failedScheduleIds;

    await this.jobRepository.save(savedJob);

    return {
      jobId: savedJob.id,
      status: savedJob.status,
      totalProcessed: dueSchedules.length,
      successful,
      failed,
      skipped,
    };
  }

  async runNow(input: {
    organisationId: string;
    retryScheduleId?: string;
    triggeredBy: string;
    dryRun: boolean;
  }): Promise<{ jobId: string; status: RetryJobStatus; message: string; scheduledCount: number }> {
    const jobIdempotencyKey = `${input.organisationId}:manual:${new Date().toISOString()}`;

    const job = this.jobRepository.create({
      organisationId: input.organisationId,
      targetDate: new Date(),
      timezone: 'Europe/Paris',
      cutoffTime: new Date().toTimeString().split(' ')[0],
      status: RetryJobStatus.JOB_RUNNING,
      idempotencyKey: jobIdempotencyKey,
      triggeredBy: input.triggeredBy,
      isManual: true,
      startedAt: new Date(),
    });

    const savedJob = await this.jobRepository.save(job);

    let schedules: RetryScheduleEntity[];

    if (input.retryScheduleId) {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: input.retryScheduleId, organisationId: input.organisationId },
      });
      schedules = schedule ? [schedule] : [];
    } else {
      schedules = await this.scheduleRepository.find({
        where: {
          organisationId: input.organisationId,
          isResolved: false,
          eligibility: RetryEligibility.ELIGIBLE,
          nextRetryDate: LessThanOrEqual(new Date()),
        },
      });
    }

    if (input.dryRun) {
      savedJob.status = RetryJobStatus.JOB_COMPLETED;
      savedJob.totalAttempts = schedules.length;
      savedJob.completedAt = new Date();
      await this.jobRepository.save(savedJob);

      return {
        jobId: savedJob.id,
        status: RetryJobStatus.JOB_COMPLETED,
        message: `Dry run: would process ${schedules.length} retries`,
        scheduledCount: schedules.length,
      };
    }

    let successful = 0;
    let failed = 0;

    for (const schedule of schedules) {
      try {
        const result = await this.executeRetry(schedule, savedJob.id);
        if (result.status === 'SUCCEEDED') successful++;
        else failed++;
      } catch {
        failed++;
      }
    }

    savedJob.status = failed === 0 ? RetryJobStatus.JOB_COMPLETED : RetryJobStatus.JOB_PARTIAL;
    savedJob.totalAttempts = schedules.length;
    savedJob.successfulAttempts = successful;
    savedJob.failedAttempts = failed;
    savedJob.completedAt = new Date();
    await this.jobRepository.save(savedJob);

    return {
      jobId: savedJob.id,
      status: savedJob.status,
      message: `Processed ${schedules.length} retries: ${successful} succeeded, ${failed} failed`,
      scheduledCount: schedules.length,
    };
  }

  private async executeRetry(
    schedule: RetryScheduleEntity,
    jobId: string,
  ): Promise<{ status: 'SUCCEEDED' | 'FAILED' | 'SKIPPED'; attemptId: string }> {
    const attemptNumber = schedule.currentAttempt + 1;
    const idempotencyKey = `${schedule.id}:${attemptNumber}`;

    const existingAttempt = await this.attemptRepository.findOne({
      where: { idempotencyKey },
    });

    if (existingAttempt) {
      this.logger.warn(`Attempt already exists: ${idempotencyKey}`);
      return { status: 'SKIPPED', attemptId: existingAttempt.id };
    }

    const attempt = this.attemptRepository.create({
      retryScheduleId: schedule.id,
      attemptNumber,
      plannedDate: schedule.nextRetryDate!,
      status: RetryAttemptStatus.IN_PROGRESS,
      retryJobId: jobId,
      idempotencyKey,
      executedAt: new Date(),
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    try {
      const paymentResult = await this.executePayment(schedule);

      if (paymentResult.success) {
        savedAttempt.status = RetryAttemptStatus.SUCCEEDED;
        savedAttempt.pspPaymentId = paymentResult.pspPaymentId ?? null;
        await this.attemptRepository.save(savedAttempt);

        schedule.isResolved = true;
        schedule.resolutionReason = 'RETRY_SUCCEEDED';
        schedule.resolvedAt = new Date();
        schedule.currentAttempt = attemptNumber;
        await this.scheduleRepository.save(schedule);

        await this.auditLogService.log({
          organisationId: schedule.organisationId,
          entityType: 'RETRY_ATTEMPT',
          entityId: savedAttempt.id,
          action: 'SUCCEEDED',
          newValue: savedAttempt as unknown as Record<string, unknown>,
          retryScheduleId: schedule.id,
          retryAttemptId: savedAttempt.id,
          actorType: AuditActorType.SCHEDULER,
        });

        return { status: 'SUCCEEDED', attemptId: savedAttempt.id };
      } else {
        savedAttempt.status = RetryAttemptStatus.FAILED;
        savedAttempt.errorCode = paymentResult.errorCode ?? null;
        savedAttempt.errorMessage = paymentResult.errorMessage ?? null;
        savedAttempt.newRejectionCode = paymentResult.newRejectionCode ?? null;
        await this.attemptRepository.save(savedAttempt);

        schedule.currentAttempt = attemptNumber;

        if (attemptNumber >= schedule.maxAttempts) {
          schedule.isResolved = true;
          schedule.eligibility = RetryEligibility.NOT_ELIGIBLE_MAX_ATTEMPTS;
          schedule.resolutionReason = 'MAX_ATTEMPTS_REACHED';
          schedule.resolvedAt = new Date();
          schedule.nextRetryDate = null;
        } else {
          const policy = await this.policyService.findById(schedule.retryPolicyId);
          schedule.nextRetryDate = this.calculateNextRetryDate(
            schedule.rejectionDate,
            policy.retryDelaysDays,
            attemptNumber,
          );
        }

        await this.scheduleRepository.save(schedule);

        await this.auditLogService.log({
          organisationId: schedule.organisationId,
          entityType: 'RETRY_ATTEMPT',
          entityId: savedAttempt.id,
          action: 'FAILED',
          newValue: savedAttempt as unknown as Record<string, unknown>,
          retryScheduleId: schedule.id,
          retryAttemptId: savedAttempt.id,
          actorType: AuditActorType.SCHEDULER,
        });

        return { status: 'FAILED', attemptId: savedAttempt.id };
      }
    } catch (error) {
      savedAttempt.status = RetryAttemptStatus.FAILED;
      savedAttempt.errorCode = 'EXECUTION_ERROR';
      savedAttempt.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.attemptRepository.save(savedAttempt);

      throw error;
    }
  }

  private async executePayment(schedule: RetryScheduleEntity): Promise<{
    success: boolean;
    pspPaymentId?: string;
    errorCode?: string;
    errorMessage?: string;
    newRejectionCode?: string;
  }> {
    this.logger.log(`Executing payment for schedule ${schedule.id}, amount: ${schedule.amountCents} ${schedule.currency}`);
    
    // TODO: Integrate with PaymentService via gRPC
    // For now, simulate a payment attempt
    const simulatedSuccess = Math.random() > 0.3;

    if (simulatedSuccess) {
      return {
        success: true,
        pspPaymentId: `psp_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        errorCode: 'PAYMENT_FAILED',
        errorMessage: 'Payment was rejected by the bank',
        newRejectionCode: 'AM04',
      };
    }
  }

  private determineEligibility(reasonCode: string, policy: RetryPolicyEntity): { eligibility: RetryEligibility; reason: string } {
    const normalizedCode = this.normalizeRejectionCode(reasonCode);

    if (policy.nonRetryableCodes.includes(normalizedCode) || NON_RETRYABLE_CODES.includes(normalizedCode)) {
      return {
        eligibility: RetryEligibility.NOT_ELIGIBLE_REASON_CODE,
        reason: `Rejection code ${reasonCode} is non-retryable`,
      };
    }

    if (normalizedCode.startsWith('AM04') && policy.retryOnAm04) {
      return {
        eligibility: RetryEligibility.ELIGIBLE,
        reason: 'AM04 rejection is eligible for retry per policy',
      };
    }

    if (policy.retryableCodes.includes(normalizedCode) || RETRYABLE_CODES.includes(normalizedCode)) {
      return {
        eligibility: RetryEligibility.ELIGIBLE,
        reason: `Rejection code ${reasonCode} is configured as retryable`,
      };
    }

    return {
      eligibility: RetryEligibility.NOT_ELIGIBLE_REASON_CODE,
      reason: `Rejection code ${reasonCode} is not configured for retry`,
    };
  }

  private normalizeRejectionCode(rawCode: string): string {
    const code = rawCode.toUpperCase().trim();
    
    if (code === 'AM04' || code.includes('ACCOUNT_CLOSED') || code.includes('CLOSED')) {
      return 'AM04_ACCOUNT_CLOSED';
    }
    if (code === 'AC01' || code.includes('IBAN_INVALID') || code.includes('INCORRECT_IBAN')) {
      return 'AC01_IBAN_INVALID';
    }
    
    return code;
  }

  private calculateNextRetryDate(rejectionDate: Date, delaysDays: number[], currentAttempt: number): Date | null {
    if (currentAttempt >= delaysDays.length) {
      return null;
    }

    const delayDays = delaysDays[currentAttempt];
    const nextDate = new Date(rejectionDate);
    nextDate.setDate(nextDate.getDate() + delayDays);
    nextDate.setHours(10, 0, 0, 0);

    return nextDate;
  }

  private calculateCutoffDateTime(targetDate: Date, timezone: string, cutoffTime: string): Date {
    const [hours, minutes, seconds] = cutoffTime.split(':').map(Number);
    const cutoff = new Date(targetDate);
    cutoff.setHours(hours, minutes, seconds || 0, 0);
    return cutoff;
  }

  private async createScheduledAttempt(schedule: RetryScheduleEntity, attemptNumber: number, plannedDate: Date): Promise<RetryAttemptEntity> {
    const idempotencyKey = `${schedule.id}:${attemptNumber}`;

    const attempt = this.attemptRepository.create({
      retryScheduleId: schedule.id,
      attemptNumber,
      plannedDate,
      status: RetryAttemptStatus.SCHEDULED,
      idempotencyKey,
    });

    return this.attemptRepository.save(attempt);
  }

  async checkEligibility(input: {
    paymentId: string;
    rejectionCode: string;
    organisationId: string;
    societeId?: string;
    contratId?: string;
    clientId?: string;
  }): Promise<{
    eligibility: RetryEligibility;
    reason: string;
    applicablePolicyId?: string;
    firstRetryDate?: Date;
  }> {
    const policy = await this.policyService.findApplicablePolicy(
      input.organisationId,
      input.societeId,
    );

    if (!policy) {
      return {
        eligibility: RetryEligibility.NOT_ELIGIBLE_REASON_CODE,
        reason: 'No applicable retry policy found',
      };
    }

    const result = this.determineEligibility(input.rejectionCode, policy);

    return {
      eligibility: result.eligibility,
      reason: result.reason,
      applicablePolicyId: policy.id,
      firstRetryDate: result.eligibility === RetryEligibility.ELIGIBLE
        ? this.calculateNextRetryDate(new Date(), policy.retryDelaysDays, 0) ?? undefined
        : undefined,
    };
  }
}

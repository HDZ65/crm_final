import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { RetryPolicyService } from './modules/retry-policy/retry-policy.service';
import { RetryScheduleService } from './modules/retry-schedule/retry-schedule.service';
import { RetryAttemptService } from './modules/retry-attempt/retry-attempt.service';
import { RetryJobService } from './modules/retry-job/retry-job.service';
import { ReminderPolicyService } from './modules/reminder-policy/reminder-policy.service';
import { ReminderService } from './modules/reminder/reminder.service';
import { AuditLogService } from './modules/audit-log/audit-log.service';
import { RetrySchedulerService } from './modules/scheduler/retry-scheduler.service';

import { RetryEligibility } from './modules/retry-schedule/entities/retry-schedule.entity';
import { RetryJobStatus } from './modules/retry-job/entities/retry-job.entity';
import { ReminderChannel, ReminderStatus, ReminderTrigger } from './modules/reminder/entities/reminder.entity';
import { AuditActorType } from './modules/audit-log/entities/retry-audit-log.entity';

import {
  validate,
  RetryPolicyValidation,
  PaymentRejectedValidation,
  RunNowValidation,
  CancelRetryScheduleValidation,
} from './common/validation.pipe';

@Controller()
export class RetryController {
  private readonly logger = new Logger(RetryController.name);

  constructor(
    private readonly policyService: RetryPolicyService,
    private readonly scheduleService: RetryScheduleService,
    private readonly attemptService: RetryAttemptService,
    private readonly jobService: RetryJobService,
    private readonly reminderPolicyService: ReminderPolicyService,
    private readonly reminderService: ReminderService,
    private readonly auditLogService: AuditLogService,
    private readonly schedulerService: RetrySchedulerService,
  ) {}

  @GrpcMethod('RetryAdminService', 'GetRetryPolicy')
  async getRetryPolicy(data: { id: string }) {
    const policy = await this.policyService.findById(data.id);
    return { policy };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryPolicies')
  async listRetryPolicies(data: {
    organisation_id: string;
    societe_id?: string;
    active_only?: boolean;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.policyService.findAll({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      activeOnly: data.active_only,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      policies: result.policies,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RetryAdminService', 'CreateRetryPolicy')
  async createRetryPolicy(data: {
    organisation_id: string;
    societe_id?: string;
    product_id?: string;
    channel_id?: string;
    name: string;
    description?: string;
    retry_delays_days: number[];
    max_attempts: number;
    max_total_days: number;
    retry_on_am04: boolean;
    retryable_codes?: string[];
    non_retryable_codes?: string[];
    stop_on_payment_settled: boolean;
    stop_on_contract_cancelled: boolean;
    stop_on_mandate_revoked: boolean;
    backoff_strategy?: string;
    is_default?: boolean;
    priority?: number;
  }) {
    validate(data as unknown as Record<string, unknown>, RetryPolicyValidation);
    
    const policy = await this.policyService.create({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      productId: data.product_id,
      channelId: data.channel_id,
      name: data.name,
      description: data.description,
      retryDelaysDays: data.retry_delays_days,
      maxAttempts: data.max_attempts,
      maxTotalDays: data.max_total_days,
      retryOnAm04: data.retry_on_am04,
      retryableCodes: data.retryable_codes,
      nonRetryableCodes: data.non_retryable_codes,
      stopOnPaymentSettled: data.stop_on_payment_settled,
      stopOnContractCancelled: data.stop_on_contract_cancelled,
      stopOnMandateRevoked: data.stop_on_mandate_revoked,
      backoffStrategy: data.backoff_strategy,
      isDefault: data.is_default,
      priority: data.priority,
    });
    return { policy };
  }

  @GrpcMethod('RetryAdminService', 'UpdateRetryPolicy')
  async updateRetryPolicy(data: {
    id: string;
    name?: string;
    description?: string;
    retry_delays_days?: number[];
    max_attempts?: number;
    max_total_days?: number;
    retry_on_am04?: boolean;
    retryable_codes?: string[];
    non_retryable_codes?: string[];
    stop_on_payment_settled?: boolean;
    stop_on_contract_cancelled?: boolean;
    stop_on_mandate_revoked?: boolean;
    backoff_strategy?: string;
    is_active?: boolean;
    is_default?: boolean;
    priority?: number;
  }) {
    const policy = await this.policyService.update({
      id: data.id,
      name: data.name,
      description: data.description,
      retryDelaysDays: data.retry_delays_days,
      maxAttempts: data.max_attempts,
      maxTotalDays: data.max_total_days,
      retryOnAm04: data.retry_on_am04,
      retryableCodes: data.retryable_codes,
      nonRetryableCodes: data.non_retryable_codes,
      stopOnPaymentSettled: data.stop_on_payment_settled,
      stopOnContractCancelled: data.stop_on_contract_cancelled,
      stopOnMandateRevoked: data.stop_on_mandate_revoked,
      backoffStrategy: data.backoff_strategy,
      isActive: data.is_active,
      isDefault: data.is_default,
      priority: data.priority,
    });
    return { policy };
  }

  @GrpcMethod('RetryAdminService', 'DeleteRetryPolicy')
  async deleteRetryPolicy(data: { id: string }) {
    const success = await this.policyService.delete(data.id);
    return { success, message: success ? 'Policy deleted' : 'Policy not found' };
  }

  @GrpcMethod('RetryAdminService', 'GetRetrySchedule')
  async getRetrySchedule(data: { id: string }) {
    const schedule = await this.scheduleService.findById(data.id);
    const attempts = await this.attemptService.findByScheduleId(data.id);
    const reminders = await this.reminderService.findAll({
      organisationId: schedule.organisationId,
      retryScheduleId: data.id,
    });

    return {
      schedule,
      attempts,
      reminders: reminders.reminders,
    };
  }

  @GrpcMethod('RetryAdminService', 'ListRetrySchedules')
  async listRetrySchedules(data: {
    organisation_id: string;
    societe_id?: string;
    client_id?: string;
    contrat_id?: string;
    eligibility?: RetryEligibility;
    is_resolved?: boolean;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.scheduleService.findAll({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      clientId: data.client_id,
      contratId: data.contrat_id,
      eligibility: data.eligibility,
      isResolved: data.is_resolved,
      nextRetryDateFrom: data.from_date ? new Date(data.from_date.seconds * 1000) : undefined,
      nextRetryDateTo: data.to_date ? new Date(data.to_date.seconds * 1000) : undefined,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      schedules: result.schedules,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RetryAdminService', 'CancelRetrySchedule')
  async cancelRetrySchedule(data: {
    id: string;
    reason: string;
    cancelled_by: string;
  }) {
    validate(data as unknown as Record<string, unknown>, CancelRetryScheduleValidation);
    
    const schedule = await this.scheduleService.cancel({
      id: data.id,
      reason: data.reason,
      cancelledBy: data.cancelled_by,
    });
    return { schedule };
  }

  @GrpcMethod('RetryAdminService', 'ReplanRetrySchedule')
  async replanRetrySchedule(data: {
    id: string;
    new_retry_date: { seconds: number };
    reason: string;
    replanned_by: string;
  }) {
    const newDate = new Date(data.new_retry_date.seconds * 1000);
    const schedule = await this.scheduleService.updateNextRetryDate(data.id, newDate);
    
    await this.auditLogService.log({
      organisationId: schedule.organisationId,
      entityType: 'RETRY_SCHEDULE',
      entityId: schedule.id,
      action: 'REPLANNED',
      newValue: { nextRetryDate: newDate.toISOString(), reason: data.reason },
      retryScheduleId: schedule.id,
      actorType: AuditActorType.USER,
      actorId: data.replanned_by,
    });

    return { schedule };
  }

  @GrpcMethod('RetryAdminService', 'GetRetryAttempt')
  async getRetryAttempt(data: { id: string }) {
    const attempt = await this.attemptService.findById(data.id);
    return { attempt };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryAttempts')
  async listRetryAttempts(data: {
    retry_schedule_id: string;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.attemptService.findAll({
      retryScheduleId: data.retry_schedule_id,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      attempts: result.attempts,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RetryAdminService', 'RunNow')
  async runNow(data: {
    organisation_id: string;
    retry_schedule_id?: string;
    triggered_by: string;
    dry_run: boolean;
  }) {
    validate(data as unknown as Record<string, unknown>, RunNowValidation);
    
    const result = await this.schedulerService.runNow({
      organisationId: data.organisation_id,
      retryScheduleId: data.retry_schedule_id,
      triggeredBy: data.triggered_by,
      dryRun: data.dry_run,
    });

    return {
      jobId: result.jobId,
      status: result.status,
      message: result.message,
      scheduledCount: result.scheduledCount,
    };
  }

  @GrpcMethod('RetryAdminService', 'GetRetryJobStatus')
  async getRetryJobStatus(data: { job_id: string }) {
    const job = await this.jobService.findById(data.job_id);
    return { job };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryJobs')
  async listRetryJobs(data: {
    organisation_id: string;
    status?: RetryJobStatus;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.jobService.findAll({
      organisationId: data.organisation_id,
      status: data.status,
      targetDateFrom: data.from_date ? new Date(data.from_date.seconds * 1000) : undefined,
      targetDateTo: data.to_date ? new Date(data.to_date.seconds * 1000) : undefined,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      jobs: result.jobs,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RetryAdminService', 'GetRetryMetrics')
  async getRetryMetrics(data: {
    organisation_id: string;
    societe_id?: string;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
  }) {
    const dateFrom = data.from_date ? new Date(data.from_date.seconds * 1000) : undefined;
    const dateTo = data.to_date ? new Date(data.to_date.seconds * 1000) : undefined;

    const scheduleStats = await this.scheduleService.getStatistics(
      data.organisation_id,
      dateFrom,
      dateTo,
    );

    const jobStats = await this.jobService.getJobStatistics(
      data.organisation_id,
      dateFrom,
      dateTo,
    );

    return {
      totalRejections: scheduleStats.total,
      am04Rejections: 0,
      otherRejections: 0,
      totalRetrySchedules: scheduleStats.total,
      eligibleForRetry: scheduleStats.eligible,
      notEligible: scheduleStats.total - scheduleStats.eligible,
      totalRetryAttempts: jobStats.totalAttempts,
      successfulRetries: jobStats.successfulAttempts,
      failedRetries: jobStats.failedAttempts,
      pendingRetries: scheduleStats.pending,
      successRate: jobStats.avgSuccessRate,
      am04Rate: 0,
      totalAmountRecoveredCents: 0,
      totalAmountPendingCents: 0,
      rejectionCodeBreakdown: [],
      dailyMetrics: [],
    };
  }

  @GrpcMethod('RetryAdminService', 'GetAuditLogs')
  async getAuditLogs(data: {
    organisation_id: string;
    entity_type?: string;
    entity_id?: string;
    action?: string;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.auditLogService.findAll({
      organisationId: data.organisation_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      action: data.action,
      fromDate: data.from_date ? new Date(data.from_date.seconds * 1000) : undefined,
      toDate: data.to_date ? new Date(data.to_date.seconds * 1000) : undefined,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
      } : undefined,
    });

    return {
      logs: result.logs,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RetrySchedulerService', 'ProcessDueRetries')
  async processDueRetries(data: {
    organisation_id: string;
    target_date: { seconds: number };
    timezone: string;
    cutoff_time: string;
    dry_run: boolean;
  }) {
    const result = await this.schedulerService.processDueRetries({
      organisationId: data.organisation_id,
      targetDate: new Date(data.target_date.seconds * 1000),
      timezone: data.timezone,
      cutoffTime: data.cutoff_time,
      dryRun: data.dry_run,
    });

    return {
      jobId: result.jobId,
      status: result.status,
      totalProcessed: result.totalProcessed,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped,
    };
  }

  @GrpcMethod('RetrySchedulerService', 'CheckEligibility')
  async checkEligibility(data: {
    payment_id: string;
    rejection_code: string;
    organisation_id: string;
    societe_id?: string;
    contrat_id?: string;
    client_id?: string;
  }) {
    const result = await this.schedulerService.checkEligibility({
      paymentId: data.payment_id,
      rejectionCode: data.rejection_code,
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      contratId: data.contrat_id,
      clientId: data.client_id,
    });

    return {
      eligibility: result.eligibility,
      reason: result.reason,
      applicablePolicyId: result.applicablePolicyId,
      firstRetryDate: result.firstRetryDate
        ? { seconds: Math.floor(result.firstRetryDate.getTime() / 1000) }
        : undefined,
    };
  }

  @GrpcMethod('RetrySchedulerService', 'HandlePaymentRejected')
  async handlePaymentRejected(data: {
    event_id: string;
    organisation_id: string;
    societe_id: string;
    payment_id: string;
    schedule_id: string;
    facture_id?: string;
    contrat_id?: string;
    client_id: string;
    reason_code: string;
    reason_message: string;
    amount_cents: number;
    currency: string;
    psp_name: string;
    psp_payment_id?: string;
    rejected_at: { seconds: number };
    idempotency_key: string;
  }) {
    validate(data as unknown as Record<string, unknown>, PaymentRejectedValidation);
    
    const result = await this.schedulerService.handlePaymentRejected({
      eventId: data.event_id,
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      paymentId: data.payment_id,
      scheduleId: data.schedule_id,
      factureId: data.facture_id,
      contratId: data.contrat_id,
      clientId: data.client_id,
      reasonCode: data.reason_code,
      reasonMessage: data.reason_message,
      amountCents: data.amount_cents,
      currency: data.currency,
      pspName: data.psp_name,
      pspPaymentId: data.psp_payment_id,
      rejectedAt: new Date(data.rejected_at.seconds * 1000),
      idempotencyKey: data.idempotency_key,
    });

    let reminderIds: string[] = [];
    if (result.processed && result.retryScheduleId) {
      try {
        const reminders = await this.reminderService.scheduleReminders({
          organisationId: data.organisation_id,
          societeId: data.societe_id,
          retryScheduleId: result.retryScheduleId,
          clientId: data.client_id,
          trigger: ReminderTrigger.ON_AM04_RECEIVED,
          variables: {
            clientId: data.client_id,
            amount: (data.amount_cents / 100).toFixed(2),
            currency: data.currency,
            rejectionCode: data.reason_code,
          },
        });
        reminderIds = reminders.map((r) => r.id);
      } catch (error) {
        this.logger.error('Failed to schedule reminders', error);
      }
    }

    return {
      processed: result.processed,
      retryScheduleId: result.retryScheduleId,
      eligibility: result.eligibility,
      message: result.message,
      reminderIds,
    };
  }

  @GrpcMethod('ReminderService', 'GetReminderPolicy')
  async getReminderPolicy(data: { id: string }) {
    const policy = await this.reminderPolicyService.findById(data.id);
    return { policy };
  }

  @GrpcMethod('ReminderService', 'ListReminderPolicies')
  async listReminderPolicies(data: {
    organisation_id: string;
    societe_id?: string;
    active_only?: boolean;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.reminderPolicyService.findAll({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      activeOnly: data.active_only,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      policies: result.policies,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ReminderService', 'GetReminder')
  async getReminder(data: { id: string }) {
    const reminder = await this.reminderService.findById(data.id);
    return { reminder };
  }

  @GrpcMethod('ReminderService', 'ListReminders')
  async listReminders(data: {
    organisation_id: string;
    retry_schedule_id?: string;
    client_id?: string;
    channel?: ReminderChannel;
    status?: ReminderStatus;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const result = await this.reminderService.findAll({
      organisationId: data.organisation_id,
      retryScheduleId: data.retry_schedule_id,
      clientId: data.client_id,
      channel: data.channel,
      status: data.status,
      pagination: data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    });

    return {
      reminders: result.reminders,
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ReminderService', 'SendReminder')
  async sendReminder(data: {
    id: string;
    force: boolean;
  }) {
    const reminder = await this.reminderService.findById(data.id);
    
    if (!data.force && reminder.status !== ReminderStatus.REMINDER_PENDING) {
      return {
        success: false,
        message: `Reminder is not pending (status: ${reminder.status})`,
        errorCode: 'NOT_PENDING',
      };
    }

    const result = await this.reminderService.sendReminder(reminder);

    return {
      success: result.success,
      message: result.success ? 'Reminder sent' : (result.errorMessage || 'Failed to send'),
      providerMessageId: result.providerMessageId,
      errorCode: result.errorCode,
    };
  }

  @GrpcMethod('ReminderService', 'UpdateDeliveryStatus')
  async updateDeliveryStatus(data: {
    reminder_id: string;
    status: string;
    provider_message_id?: string;
    delivery_status_raw?: string;
    error_code?: string;
    error_message?: string;
  }) {
    const statusMap: Record<string, 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed'> = {
      REMINDER_DELIVERED: 'delivered',
      REMINDER_BOUNCED: 'bounced',
      REMINDER_OPENED: 'opened',
      REMINDER_CLICKED: 'clicked',
      REMINDER_FAILED: 'failed',
    };

    await this.reminderService.handleDeliveryStatus({
      providerMessageId: data.provider_message_id || data.reminder_id,
      status: statusMap[data.status] || 'delivered',
      rawStatus: data.delivery_status_raw,
      errorCode: data.error_code,
      errorMessage: data.error_message,
    });

    const reminder = await this.reminderService.findById(data.reminder_id);
    return { reminder };
  }
}

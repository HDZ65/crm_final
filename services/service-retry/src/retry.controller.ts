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

import { RetryPolicyEntity } from './modules/retry-policy/entities/retry-policy.entity';
import { RetryScheduleEntity, RetryEligibility } from './modules/retry-schedule/entities/retry-schedule.entity';
import { RetryAttemptEntity, RetryAttemptStatus } from './modules/retry-attempt/entities/retry-attempt.entity';
import { RetryJobEntity, RetryJobStatus } from './modules/retry-job/entities/retry-job.entity';
import { ReminderPolicyEntity } from './modules/reminder-policy/entities/reminder-policy.entity';
import { ReminderEntity, ReminderChannel, ReminderStatus, ReminderTrigger } from './modules/reminder/entities/reminder.entity';
import { RetryAuditLogEntity, AuditActorType } from './modules/audit-log/entities/retry-audit-log.entity';

import {
  validate,
  RetryPolicyValidation,
  PaymentRejectedValidation,
  RunNowValidation,
  CancelRetryScheduleValidation,
} from './common/validation.pipe';

function toProtoRetryPolicy(entity: RetryPolicyEntity): Record<string, unknown> {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    societe_id: entity.societeId,
    product_id: entity.productId,
    channel_id: entity.channelId,
    name: entity.name,
    description: entity.description || '',
    retry_delays_days: entity.retryDelaysDays,
    max_attempts: entity.maxAttempts,
    max_total_days: entity.maxTotalDays,
    retry_on_am04: entity.retryOnAm04,
    retryable_codes: entity.retryableCodes,
    non_retryable_codes: entity.nonRetryableCodes,
    stop_on_payment_settled: entity.stopOnPaymentSettled,
    stop_on_contract_cancelled: entity.stopOnContractCancelled,
    stop_on_mandate_revoked: entity.stopOnMandateRevoked,
    backoff_strategy: entity.backoffStrategy,
    is_active: entity.isActive,
    is_default: entity.isDefault,
    priority: entity.priority,
    created_at: entity.createdAt?.toISOString(),
    updated_at: entity.updatedAt?.toISOString(),
  };
}

function toProtoRetrySchedule(entity: RetryScheduleEntity): Record<string, unknown> {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    societe_id: entity.societeId,
    original_payment_id: entity.originalPaymentId,
    schedule_id: entity.scheduleId,
    facture_id: entity.factureId,
    contrat_id: entity.contratId,
    client_id: entity.clientId,
    rejection_code: entity.rejectionCode,
    rejection_raw_code: entity.rejectionRawCode,
    rejection_message: entity.rejectionMessage,
    rejection_date: entity.rejectionDate?.toISOString(),
    retry_policy_id: entity.retryPolicyId,
    amount_cents: entity.amountCents,
    currency: entity.currency,
    eligibility: entity.eligibility,
    eligibility_reason: entity.eligibilityReason,
    current_attempt: entity.currentAttempt,
    max_attempts: entity.maxAttempts,
    next_retry_date: entity.nextRetryDate?.toISOString(),
    is_resolved: entity.isResolved,
    resolution_reason: entity.resolutionReason,
    resolved_at: entity.resolvedAt?.toISOString(),
    created_at: entity.createdAt?.toISOString(),
    updated_at: entity.updatedAt?.toISOString(),
  };
}

function toProtoRetryAttempt(entity: RetryAttemptEntity): Record<string, unknown> {
  return {
    id: entity.id,
    retry_schedule_id: entity.retryScheduleId,
    attempt_number: entity.attemptNumber,
    planned_date: entity.plannedDate?.toISOString(),
    executed_at: entity.executedAt?.toISOString(),
    status: entity.status,
    psp_payment_id: entity.pspPaymentId,
    psp_response_code: entity.pspResponseCode,
    error_code: entity.errorCode,
    error_message: entity.errorMessage,
    new_rejection_code: entity.newRejectionCode,
    retry_job_id: entity.retryJobId,
    created_at: entity.createdAt?.toISOString(),
    updated_at: entity.updatedAt?.toISOString(),
  };
}

function toProtoRetryJob(entity: RetryJobEntity): Record<string, unknown> {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    target_date: entity.targetDate?.toISOString(),
    timezone: entity.timezone,
    cutoff_time: entity.cutoffTime,
    status: entity.status,
    started_at: entity.startedAt?.toISOString(),
    completed_at: entity.completedAt?.toISOString(),
    total_attempts: entity.totalAttempts,
    successful_attempts: entity.successfulAttempts,
    failed_attempts: entity.failedAttempts,
    skipped_attempts: entity.skippedAttempts,
    triggered_by: entity.triggeredBy,
    is_manual: entity.isManual,
    created_at: entity.createdAt?.toISOString(),
    updated_at: entity.updatedAt?.toISOString(),
  };
}

function toProtoReminderPolicy(entity: ReminderPolicyEntity): Record<string, unknown> {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    societe_id: entity.societeId,
    name: entity.name,
    description: entity.description || '',
    trigger_rules: entity.triggerRules,
    cooldown_hours: entity.cooldownHours,
    max_reminders_per_day: entity.maxRemindersPerDay,
    max_reminders_per_week: entity.maxRemindersPerWeek,
    allowed_start_hour: entity.allowedStartHour,
    allowed_end_hour: entity.allowedEndHour,
    allowed_days_of_week: entity.allowedDaysOfWeek,
    respect_opt_out: entity.respectOptOut,
    is_active: entity.isActive,
    is_default: entity.isDefault,
    priority: entity.priority,
    created_at: entity.createdAt?.toISOString(),
    updated_at: entity.updatedAt?.toISOString(),
  };
}

function toProtoReminder(entity: ReminderEntity): Record<string, unknown> {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    societe_id: entity.societeId,
    retry_schedule_id: entity.retryScheduleId,
    retry_attempt_id: entity.retryAttemptId,
    client_id: entity.clientId,
    reminder_policy_id: entity.reminderPolicyId,
    trigger_rule_id: entity.triggerRuleId,
    channel: entity.channel,
    template_id: entity.templateId,
    template_variables: entity.templateVariables,
    trigger: entity.trigger,
    planned_at: entity.plannedAt?.toISOString(),
    sent_at: entity.sentAt?.toISOString(),
    delivered_at: entity.deliveredAt?.toISOString(),
    status: entity.status,
    provider_name: entity.providerName,
    provider_message_id: entity.providerMessageId,
    delivery_status_raw: entity.deliveryStatusRaw,
    error_code: entity.errorCode,
    error_message: entity.errorMessage,
    retry_count: entity.retryCount,
    created_at: entity.createdAt?.toISOString(),
    updated_at: entity.updatedAt?.toISOString(),
  };
}

function toProtoAuditLog(entity: RetryAuditLogEntity): Record<string, unknown> {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    entity_type: entity.entityType,
    entity_id: entity.entityId,
    action: entity.action,
    old_value: entity.oldValue ? JSON.stringify(entity.oldValue) : '',
    new_value: entity.newValue ? JSON.stringify(entity.newValue) : '',
    changed_fields: entity.changedFields,
    retry_schedule_id: entity.retryScheduleId,
    retry_attempt_id: entity.retryAttemptId,
    reminder_id: entity.reminderId,
    payment_id: entity.paymentId,
    actor_type: entity.actorType,
    actor_id: entity.actorId,
    actor_ip: entity.actorIp,
    timestamp: entity.timestamp?.toISOString(),
    metadata: entity.metadata,
  };
}

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
  async getRetryPolicy(data: { id: string }): Promise<{ policy: Record<string, unknown> }> {
    const policy = await this.policyService.findById(data.id);
    return { policy: toProtoRetryPolicy(policy) };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryPolicies')
  async listRetryPolicies(data: {
    organisation_id: string;
    societe_id?: string;
    active_only?: boolean;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }): Promise<{
    policies: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      policies: result.policies.map(toProtoRetryPolicy),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
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
  }): Promise<{ policy: Record<string, unknown> }> {
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
    return { policy: toProtoRetryPolicy(policy) };
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
  }): Promise<{ policy: Record<string, unknown> }> {
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
    return { policy: toProtoRetryPolicy(policy) };
  }

  @GrpcMethod('RetryAdminService', 'DeleteRetryPolicy')
  async deleteRetryPolicy(data: { id: string }): Promise<{ success: boolean; message: string }> {
    const success = await this.policyService.delete(data.id);
    return { success, message: success ? 'Policy deleted' : 'Policy not found' };
  }

  @GrpcMethod('RetryAdminService', 'GetRetrySchedule')
  async getRetrySchedule(data: { id: string }): Promise<{
    schedule: Record<string, unknown>;
    attempts: Record<string, unknown>[];
    reminders: Record<string, unknown>[];
  }> {
    const schedule = await this.scheduleService.findById(data.id);
    const attempts = await this.attemptService.findByScheduleId(data.id);
    const reminders = await this.reminderService.findAll({
      organisationId: schedule.organisationId,
      retryScheduleId: data.id,
    });

    return {
      schedule: toProtoRetrySchedule(schedule),
      attempts: attempts.map(toProtoRetryAttempt),
      reminders: reminders.reminders.map(toProtoReminder),
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
  }): Promise<{
    schedules: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      schedules: result.schedules.map(toProtoRetrySchedule),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('RetryAdminService', 'CancelRetrySchedule')
  async cancelRetrySchedule(data: {
    id: string;
    reason: string;
    cancelled_by: string;
  }): Promise<{ schedule: Record<string, unknown> }> {
    validate(data as unknown as Record<string, unknown>, CancelRetryScheduleValidation);
    
    const schedule = await this.scheduleService.cancel({
      id: data.id,
      reason: data.reason,
      cancelledBy: data.cancelled_by,
    });
    return { schedule: toProtoRetrySchedule(schedule) };
  }

  @GrpcMethod('RetryAdminService', 'ReplanRetrySchedule')
  async replanRetrySchedule(data: {
    id: string;
    new_retry_date: { seconds: number };
    reason: string;
    replanned_by: string;
  }): Promise<{ schedule: Record<string, unknown> }> {
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

    return { schedule: toProtoRetrySchedule(schedule) };
  }

  @GrpcMethod('RetryAdminService', 'GetRetryAttempt')
  async getRetryAttempt(data: { id: string }): Promise<{ attempt: Record<string, unknown> }> {
    const attempt = await this.attemptService.findById(data.id);
    return { attempt: toProtoRetryAttempt(attempt) };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryAttempts')
  async listRetryAttempts(data: {
    retry_schedule_id: string;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }): Promise<{
    attempts: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      attempts: result.attempts.map(toProtoRetryAttempt),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('RetryAdminService', 'RunNow')
  async runNow(data: {
    organisation_id: string;
    retry_schedule_id?: string;
    triggered_by: string;
    dry_run: boolean;
  }): Promise<{
    job_id: string;
    status: RetryJobStatus;
    message: string;
    scheduled_count: number;
  }> {
    validate(data as unknown as Record<string, unknown>, RunNowValidation);
    
    const result = await this.schedulerService.runNow({
      organisationId: data.organisation_id,
      retryScheduleId: data.retry_schedule_id,
      triggeredBy: data.triggered_by,
      dryRun: data.dry_run,
    });

    return {
      job_id: result.jobId,
      status: result.status,
      message: result.message,
      scheduled_count: result.scheduledCount,
    };
  }

  @GrpcMethod('RetryAdminService', 'GetRetryJobStatus')
  async getRetryJobStatus(data: { job_id: string }): Promise<{ job: Record<string, unknown> }> {
    const job = await this.jobService.findById(data.job_id);
    return { job: toProtoRetryJob(job) };
  }

  @GrpcMethod('RetryAdminService', 'ListRetryJobs')
  async listRetryJobs(data: {
    organisation_id: string;
    status?: RetryJobStatus;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }): Promise<{
    jobs: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      jobs: result.jobs.map(toProtoRetryJob),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('RetryAdminService', 'GetRetryMetrics')
  async getRetryMetrics(data: {
    organisation_id: string;
    societe_id?: string;
    from_date?: { seconds: number };
    to_date?: { seconds: number };
  }): Promise<Record<string, unknown>> {
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
      total_rejections: scheduleStats.total,
      am04_rejections: 0,
      other_rejections: 0,
      total_retry_schedules: scheduleStats.total,
      eligible_for_retry: scheduleStats.eligible,
      not_eligible: scheduleStats.total - scheduleStats.eligible,
      total_retry_attempts: jobStats.totalAttempts,
      successful_retries: jobStats.successfulAttempts,
      failed_retries: jobStats.failedAttempts,
      pending_retries: scheduleStats.pending,
      success_rate: jobStats.avgSuccessRate,
      am04_rate: 0,
      total_amount_recovered_cents: 0,
      total_amount_pending_cents: 0,
      rejection_code_breakdown: [],
      daily_metrics: [],
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
  }): Promise<{
    logs: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      logs: result.logs.map(toProtoAuditLog),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('RetrySchedulerService', 'ProcessDueRetries')
  async processDueRetries(data: {
    organisation_id: string;
    target_date: { seconds: number };
    timezone: string;
    cutoff_time: string;
    dry_run: boolean;
  }): Promise<{
    job_id: string;
    status: RetryJobStatus;
    total_processed: number;
    successful: number;
    failed: number;
    skipped: number;
  }> {
    const result = await this.schedulerService.processDueRetries({
      organisationId: data.organisation_id,
      targetDate: new Date(data.target_date.seconds * 1000),
      timezone: data.timezone,
      cutoffTime: data.cutoff_time,
      dryRun: data.dry_run,
    });

    return {
      job_id: result.jobId,
      status: result.status,
      total_processed: result.totalProcessed,
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
  }): Promise<{
    eligibility: RetryEligibility;
    reason: string;
    applicable_policy_id?: string;
    first_retry_date?: { seconds: number };
  }> {
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
      applicable_policy_id: result.applicablePolicyId,
      first_retry_date: result.firstRetryDate
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
  }): Promise<{
    processed: boolean;
    retry_schedule_id?: string;
    eligibility: RetryEligibility;
    message: string;
    reminder_ids: string[];
  }> {
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
      retry_schedule_id: result.retryScheduleId,
      eligibility: result.eligibility,
      message: result.message,
      reminder_ids: reminderIds,
    };
  }

  @GrpcMethod('ReminderService', 'GetReminderPolicy')
  async getReminderPolicy(data: { id: string }): Promise<{ policy: Record<string, unknown> }> {
    const policy = await this.reminderPolicyService.findById(data.id);
    return { policy: toProtoReminderPolicy(policy) };
  }

  @GrpcMethod('ReminderService', 'ListReminderPolicies')
  async listReminderPolicies(data: {
    organisation_id: string;
    societe_id?: string;
    active_only?: boolean;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }): Promise<{
    policies: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      policies: result.policies.map(toProtoReminderPolicy),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('ReminderService', 'GetReminder')
  async getReminder(data: { id: string }): Promise<{ reminder: Record<string, unknown> }> {
    const reminder = await this.reminderService.findById(data.id);
    return { reminder: toProtoReminder(reminder) };
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
  }): Promise<{
    reminders: Record<string, unknown>[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
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
      reminders: result.reminders.map(toProtoReminder),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('ReminderService', 'SendReminder')
  async sendReminder(data: {
    id: string;
    force: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    provider_message_id?: string;
    error_code?: string;
  }> {
    const reminder = await this.reminderService.findById(data.id);
    
    if (!data.force && reminder.status !== ReminderStatus.REMINDER_PENDING) {
      return {
        success: false,
        message: `Reminder is not pending (status: ${reminder.status})`,
        error_code: 'NOT_PENDING',
      };
    }

    const result = await this.reminderService.sendReminder(reminder);

    return {
      success: result.success,
      message: result.success ? 'Reminder sent' : (result.errorMessage || 'Failed to send'),
      provider_message_id: result.providerMessageId,
      error_code: result.errorCode,
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
  }): Promise<{ reminder: Record<string, unknown> }> {
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
    return { reminder: toProtoReminder(reminder) };
  }
}

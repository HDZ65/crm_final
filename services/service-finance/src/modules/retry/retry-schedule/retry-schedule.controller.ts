import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RetryScheduleService } from './retry-schedule.service';
import { RetryAttemptService } from '../retry-attempt/retry-attempt.service';
import { RetryJobService } from '../retry-job/retry-job.service';
import { ReminderService } from '../reminder/reminder.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RetryEligibility } from './entities/retry-schedule.entity';
import { RetryJobStatus } from '../retry-job/entities/retry-job.entity';
import { AuditActorType } from '../audit-log/entities/retry-audit-log.entity';
import { validate, CancelRetryScheduleValidation } from '../common/validation.pipe';

@Controller()
export class RetryScheduleController {
  constructor(
    private readonly scheduleService: RetryScheduleService,
    private readonly attemptService: RetryAttemptService,
    private readonly jobService: RetryJobService,
    private readonly reminderService: ReminderService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
        sort_by: data.pagination.sort_by,
        sort_order: data.pagination.sort_order,
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
      cancelled_by: data.cancelled_by,
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
        sort_by: data.pagination.sort_by,
        sort_order: data.pagination.sort_order,
      } : undefined,
    });

    return {
      attempts: result.attempts,
      pagination: result.pagination,
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
        sort_by: data.pagination.sort_by,
        sort_order: data.pagination.sort_order,
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
}

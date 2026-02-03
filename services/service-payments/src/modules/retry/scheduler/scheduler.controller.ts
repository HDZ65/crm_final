import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RetrySchedulerService } from './retry-scheduler.service';
import { ReminderService } from '../reminder/reminder.service';
import { ReminderTrigger } from '../reminder/entities/reminder.entity';
import { validate, PaymentRejectedValidation, RunNowValidation } from '../../common/validation.pipe';

@Controller()
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);

  constructor(
    private readonly schedulerService: RetrySchedulerService,
    private readonly reminderService: ReminderService,
  ) {}

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
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReminderService } from './reminder.service';
import { ReminderPolicyService } from '../reminder-policy/reminder-policy.service';
import { ReminderChannel, ReminderStatus } from './entities/reminder.entity';

@Controller()
export class ReminderController {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly reminderPolicyService: ReminderPolicyService,
  ) {}

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

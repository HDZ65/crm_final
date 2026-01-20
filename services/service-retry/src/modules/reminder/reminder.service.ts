import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Cron } from '@nestjs/schedule';

import {
  ReminderEntity,
  ReminderChannel,
  ReminderStatus,
  ReminderTrigger,
} from './entities/reminder.entity';
import { ReminderPolicyService } from '../reminder-policy/reminder-policy.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditActorType } from '../audit-log/entities/retry-audit-log.entity';

interface CreateReminderInput {
  organisationId: string;
  societeId: string;
  retryScheduleId: string;
  retryAttemptId?: string;
  clientId: string;
  reminderPolicyId: string;
  triggerRuleId?: string;
  channel: ReminderChannel;
  templateId: string;
  templateVariables: Record<string, string>;
  trigger: ReminderTrigger;
  plannedAt: Date;
}

interface ScheduleRemindersInput {
  organisationId: string;
  societeId: string;
  retryScheduleId: string;
  clientId: string;
  trigger: ReminderTrigger;
  retryAttemptId?: string;
  variables: Record<string, string>;
}

interface SendReminderResult {
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface ListRemindersInput {
  organisationId: string;
  retryScheduleId?: string;
  clientId?: string;
  channel?: ReminderChannel;
  status?: ReminderStatus;
  trigger?: ReminderTrigger;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(ReminderEntity)
    private readonly reminderRepository: Repository<ReminderEntity>,
    private readonly policyService: ReminderPolicyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Scheduled job to process pending reminders every 5 minutes
   */
  @Cron('*/5 * * * *', { timeZone: 'Europe/Paris' })
  async processPendingReminders(): Promise<void> {
    this.logger.log('Processing pending reminders...');

    const pendingReminders = await this.reminderRepository.find({
      where: {
        status: ReminderStatus.REMINDER_PENDING,
        plannedAt: LessThanOrEqual(new Date()),
      },
      take: 100,
      order: { plannedAt: 'ASC' },
    });

    this.logger.log(`Found ${pendingReminders.length} pending reminders to process`);

    for (const reminder of pendingReminders) {
      try {
        await this.sendReminder(reminder);
      } catch (error) {
        this.logger.error(`Failed to send reminder ${reminder.id}`, error);
      }
    }
  }

  async scheduleReminders(input: ScheduleRemindersInput): Promise<ReminderEntity[]> {
    const policy = await this.policyService.findApplicablePolicy(
      input.organisationId,
      input.societeId,
    );

    if (!policy) {
      this.logger.warn(`No reminder policy found for org ${input.organisationId}`);
      return [];
    }

    const matchingRules = policy.triggerRules.filter((r) => r.trigger === input.trigger);
    if (matchingRules.length === 0) {
      this.logger.log(`No trigger rules for ${input.trigger} in policy ${policy.id}`);
      return [];
    }

    const reminders: ReminderEntity[] = [];

    for (const rule of matchingRules) {
      const idempotencyKey = `${input.retryScheduleId}:${input.trigger}:${rule.channel}:${input.retryAttemptId || 'initial'}`;

      const existing = await this.reminderRepository.findOne({
        where: { idempotencyKey },
      });

      if (existing) {
        this.logger.warn(`Reminder already exists: ${idempotencyKey}`);
        reminders.push(existing);
        continue;
      }

      const plannedAt = new Date();
      plannedAt.setHours(plannedAt.getHours() + rule.delayHours);

      const reminder = await this.create({
        organisationId: input.organisationId,
        societeId: input.societeId,
        retryScheduleId: input.retryScheduleId,
        retryAttemptId: input.retryAttemptId,
        clientId: input.clientId,
        reminderPolicyId: policy.id,
        triggerRuleId: rule.id,
        channel: rule.channel as ReminderChannel,
        templateId: rule.templateId,
        templateVariables: input.variables,
        trigger: input.trigger,
        plannedAt,
      });

      reminders.push(reminder);
    }

    return reminders;
  }

  /**
   * Create a single reminder
   */
  async create(input: CreateReminderInput): Promise<ReminderEntity> {
    const idempotencyKey = `${input.retryScheduleId}:${input.trigger}:${input.channel}:${input.retryAttemptId || 'initial'}`;

    const existing = await this.reminderRepository.findOne({
      where: { idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    const reminder = this.reminderRepository.create({
      organisationId: input.organisationId,
      societeId: input.societeId,
      retryScheduleId: input.retryScheduleId,
      retryAttemptId: input.retryAttemptId || null,
      clientId: input.clientId,
      reminderPolicyId: input.reminderPolicyId,
      triggerRuleId: input.triggerRuleId || null,
      channel: input.channel,
      templateId: input.templateId,
      templateVariables: input.templateVariables,
      trigger: input.trigger,
      plannedAt: input.plannedAt,
      status: ReminderStatus.REMINDER_PENDING,
      idempotencyKey,
    });

    const saved = await this.reminderRepository.save(reminder);

    await this.auditLogService.log({
      organisationId: input.organisationId,
      entityType: 'REMINDER',
      entityId: saved.id,
      action: 'CREATED',
      newValue: saved as unknown as Record<string, unknown>,
      retryScheduleId: input.retryScheduleId,
      reminderId: saved.id,
      actorType: AuditActorType.SCHEDULER,
    });

    return saved;
  }

  /**
   * Send a reminder via the appropriate channel
   */
  async sendReminder(reminder: ReminderEntity): Promise<SendReminderResult> {
    this.logger.log(`Sending reminder ${reminder.id} via ${reminder.channel}`);

    let result: SendReminderResult;

    try {
      switch (reminder.channel) {
        case ReminderChannel.EMAIL:
          result = await this.sendEmail(reminder);
          break;
        case ReminderChannel.SMS:
          result = await this.sendSms(reminder);
          break;
        case ReminderChannel.PHONE_CALL:
          result = await this.schedulePhoneCall(reminder);
          break;
        case ReminderChannel.PUSH_NOTIFICATION:
          result = await this.sendPushNotification(reminder);
          break;
        case ReminderChannel.POSTAL_MAIL:
          result = await this.schedulePostalMail(reminder);
          break;
        default:
          throw new Error(`Unsupported channel: ${reminder.channel}`);
      }

      if (result.success) {
        reminder.status = ReminderStatus.REMINDER_SENT;
        reminder.sentAt = new Date();
        reminder.providerMessageId = result.providerMessageId || null;
      } else {
        reminder.status = ReminderStatus.REMINDER_FAILED;
        reminder.errorCode = result.errorCode || 'SEND_FAILED';
        reminder.errorMessage = result.errorMessage || 'Failed to send reminder';
        reminder.retryCount++;
      }
    } catch (error) {
      result = {
        success: false,
        errorCode: 'EXCEPTION',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      reminder.status = ReminderStatus.REMINDER_FAILED;
      reminder.errorCode = 'EXCEPTION';
      reminder.errorMessage = result.errorMessage;
      reminder.retryCount++;
    }

    await this.reminderRepository.save(reminder);

    await this.auditLogService.log({
      organisationId: reminder.organisationId,
      entityType: 'REMINDER',
      entityId: reminder.id,
      action: result.success ? 'SENT' : 'FAILED',
      newValue: {
        status: reminder.status,
        sentAt: reminder.sentAt,
        errorCode: reminder.errorCode,
        errorMessage: reminder.errorMessage,
      },
      retryScheduleId: reminder.retryScheduleId,
      reminderId: reminder.id,
      actorType: AuditActorType.SCHEDULER,
    });

    return result;
  }

  /**
   * Handle delivery status webhook from provider
   */
  async handleDeliveryStatus(input: {
    providerMessageId: string;
    status: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed';
    rawStatus?: string;
    errorCode?: string;
    errorMessage?: string;
  }): Promise<void> {
    const reminder = await this.reminderRepository.findOne({
      where: { providerMessageId: input.providerMessageId },
    });

    if (!reminder) {
      this.logger.warn(`Reminder not found for provider message ${input.providerMessageId}`);
      return;
    }

    switch (input.status) {
      case 'delivered':
        reminder.status = ReminderStatus.REMINDER_DELIVERED;
        reminder.deliveredAt = new Date();
        break;
      case 'bounced':
        reminder.status = ReminderStatus.REMINDER_BOUNCED;
        break;
      case 'opened':
        reminder.status = ReminderStatus.REMINDER_OPENED;
        break;
      case 'clicked':
        reminder.status = ReminderStatus.REMINDER_CLICKED;
        break;
      case 'failed':
        reminder.status = ReminderStatus.REMINDER_FAILED;
        reminder.errorCode = input.errorCode || 'DELIVERY_FAILED';
        reminder.errorMessage = input.errorMessage || 'Delivery failed';
        break;
    }

    if (input.rawStatus) {
      reminder.deliveryStatusRaw = input.rawStatus;
    }

    await this.reminderRepository.save(reminder);

    await this.auditLogService.log({
      organisationId: reminder.organisationId,
      entityType: 'REMINDER',
      entityId: reminder.id,
      action: `DELIVERY_${input.status.toUpperCase()}`,
      newValue: {
        status: reminder.status,
        deliveredAt: reminder.deliveredAt,
        deliveryStatusRaw: reminder.deliveryStatusRaw,
      },
      retryScheduleId: reminder.retryScheduleId,
      reminderId: reminder.id,
      actorType: AuditActorType.WEBHOOK,
    });
  }

  /**
   * Cancel pending reminders for a retry schedule
   */
  async cancelForSchedule(retryScheduleId: string, reason: string): Promise<number> {
    const result = await this.reminderRepository.update(
      {
        retryScheduleId,
        status: ReminderStatus.REMINDER_PENDING,
      },
      {
        status: ReminderStatus.REMINDER_CANCELLED,
        errorMessage: reason,
      },
    );

    return result.affected ?? 0;
  }

  async findById(id: string): Promise<ReminderEntity> {
    const reminder = await this.reminderRepository.findOne({
      where: { id },
      relations: ['schedule', 'policy'],
    });

    if (!reminder) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Reminder ${id} not found`,
      });
    }

    return reminder;
  }

  async findAll(input: ListRemindersInput): Promise<{
    reminders: ReminderEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'plannedAt';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.reminderRepository
      .createQueryBuilder('reminder')
      .where('reminder.organisationId = :organisationId', { organisationId: input.organisationId });

    if (input.retryScheduleId) {
      queryBuilder.andWhere('reminder.retryScheduleId = :retryScheduleId', {
        retryScheduleId: input.retryScheduleId,
      });
    }

    if (input.clientId) {
      queryBuilder.andWhere('reminder.clientId = :clientId', { clientId: input.clientId });
    }

    if (input.channel) {
      queryBuilder.andWhere('reminder.channel = :channel', { channel: input.channel });
    }

    if (input.status) {
      queryBuilder.andWhere('reminder.status = :status', { status: input.status });
    }

    if (input.trigger) {
      queryBuilder.andWhere('reminder.trigger = :trigger', { trigger: input.trigger });
    }

    const [reminders, total] = await queryBuilder
      .orderBy(`reminder.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      reminders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async sendEmail(reminder: ReminderEntity): Promise<SendReminderResult> {
    this.logger.log(`[EMAIL] Sending to client ${reminder.clientId}, template: ${reminder.templateId}`);
    
    // TODO(email-integration): Integrate with Brevo/SendGrid
    const success = Math.random() > 0.1;
    
    return {
      success,
      providerMessageId: success ? `email_${Date.now()}` : undefined,
      errorCode: success ? undefined : 'EMAIL_SEND_FAILED',
      errorMessage: success ? undefined : 'Failed to send email',
    };
  }

  private async sendSms(reminder: ReminderEntity): Promise<SendReminderResult> {
    this.logger.log(`[SMS] Sending to client ${reminder.clientId}, template: ${reminder.templateId}`);
    
    // TODO(sms-integration): Integrate with Twilio/Vonage
    const success = Math.random() > 0.15;
    
    return {
      success,
      providerMessageId: success ? `sms_${Date.now()}` : undefined,
      errorCode: success ? undefined : 'SMS_SEND_FAILED',
      errorMessage: success ? undefined : 'Failed to send SMS',
    };
  }

  private async schedulePhoneCall(reminder: ReminderEntity): Promise<SendReminderResult> {
    this.logger.log(`[PHONE] Scheduling call for client ${reminder.clientId}`);
    
    // TODO(phone-integration): Create task for call center
    return {
      success: true,
      providerMessageId: `call_task_${Date.now()}`,
    };
  }

  private async sendPushNotification(reminder: ReminderEntity): Promise<SendReminderResult> {
    this.logger.log(`[PUSH] Sending to client ${reminder.clientId}`);
    
    // TODO(push-integration): Integrate with Firebase/OneSignal
    return {
      success: true,
      providerMessageId: `push_${Date.now()}`,
    };
  }

  private async schedulePostalMail(reminder: ReminderEntity): Promise<SendReminderResult> {
    this.logger.log(`[POSTAL] Scheduling postal mail for client ${reminder.clientId}`);
    
    // TODO(postal-integration): Create entry for mail merge export
    return {
      success: true,
      providerMessageId: `postal_${Date.now()}`,
    };
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetryPolicyEntity } from '../../../../../domain/payments/entities/retry-policy.entity';
import {
  ReminderPolicyEntity,
  ReminderTriggerRule,
} from '../../../../../domain/payments/entities/reminder-policy.entity';

/**
 * Well-known IDs for Mondial TV dunning seed data.
 * Using deterministic UUIDs so seeds are idempotent.
 */
export const MONDIAL_TV_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const MONDIAL_TV_RETRY_POLICY_ID = 'a0000000-0000-4000-8000-000000000010';
export const MONDIAL_TV_REMINDER_POLICY_ID = 'a0000000-0000-4000-8000-000000000020';

/** RetryPolicy seed configuration for Mondial TV CB dunning */
export function buildMondialTvRetryPolicy(): Partial<RetryPolicyEntity> {
  return {
    id: MONDIAL_TV_RETRY_POLICY_ID,
    organisationId: MONDIAL_TV_ORG_ID,
    societeId: null,
    productId: null,
    channelId: null,
    name: 'Mondial TV - CB Dunning',
    description:
      'Politique de relance CB pour abonnements Mondial TV WEB_DIRECT. Retry à J+2, J+5, J+10.',
    retryDelaysDays: [2, 5, 10],
    maxAttempts: 3,
    maxTotalDays: 10,
    backoffStrategy: 'FIXED',
    retryOnAm04: true,
    retryableCodes: [],
    nonRetryableCodes: [],
    stopOnPaymentSettled: true,
    stopOnContractCancelled: true,
    stopOnMandateRevoked: true,
    isActive: true,
    isDefault: false,
    priority: 10,
  };
}

/** ReminderPolicy seed configuration with 4 trigger rules for Mondial TV */
export function buildMondialTvReminderPolicy(): Partial<ReminderPolicyEntity> {
  const triggerRules: ReminderTriggerRule[] = [
    {
      id: 'rule-j0-email',
      trigger: 'PAYMENT_FAILED',
      channel: 'email',
      templateId: 'mondial-tv-soft-reminder',
      delayHours: 0,
      daysBeforeRetry: 0,
      order: 1,
      onlyIfNoResponse: false,
      onlyFirstRejection: true,
    },
    {
      id: 'rule-j2-sms',
      trigger: 'RETRY_SCHEDULED',
      channel: 'sms',
      templateId: 'mondial-tv-cb-update-sms',
      delayHours: 0,
      daysBeforeRetry: 2,
      order: 2,
      onlyIfNoResponse: true,
      onlyFirstRejection: false,
    },
    {
      id: 'rule-j5-email',
      trigger: 'RETRY_FAILED',
      channel: 'email',
      templateId: 'mondial-tv-final-warning',
      delayHours: 0,
      daysBeforeRetry: 5,
      order: 3,
      onlyIfNoResponse: true,
      onlyFirstRejection: false,
    },
    {
      id: 'rule-j10-system',
      trigger: 'MAX_RETRIES_EXCEEDED',
      channel: 'system',
      templateId: 'mondial-tv-suspension',
      delayHours: 0,
      daysBeforeRetry: 10,
      order: 4,
      onlyIfNoResponse: false,
      onlyFirstRejection: false,
    },
  ];

  return {
    id: MONDIAL_TV_REMINDER_POLICY_ID,
    organisationId: MONDIAL_TV_ORG_ID,
    societeId: null,
    name: 'Mondial TV - Dunning Reminders',
    description:
      'Politique de rappels dunning Mondial TV: J0 email, J+2 SMS, J+5 email, J+10 suspension système.',
    triggerRules,
    cooldownHours: 24,
    maxRemindersPerDay: 3,
    maxRemindersPerWeek: 10,
    allowedStartHour: 9,
    allowedEndHour: 19,
    allowedDaysOfWeek: [1, 2, 3, 4, 5],
    respectOptOut: true,
    isActive: true,
    isDefault: false,
    priority: 10,
  };
}

@Injectable()
export class DunningSeedService implements OnModuleInit {
  private readonly logger = new Logger(DunningSeedService.name);

  constructor(
    @InjectRepository(RetryPolicyEntity)
    private readonly retryPolicyRepo: Repository<RetryPolicyEntity>,
    @InjectRepository(ReminderPolicyEntity)
    private readonly reminderPolicyRepo: Repository<ReminderPolicyEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedRetryPolicy();
    await this.seedReminderPolicy();
  }

  async seedRetryPolicy(): Promise<RetryPolicyEntity> {
    const existing = await this.retryPolicyRepo.findOne({
      where: { id: MONDIAL_TV_RETRY_POLICY_ID },
    });

    if (existing) {
      this.logger.debug('Mondial TV RetryPolicy seed already exists — skipping');
      return existing;
    }

    const entity = this.retryPolicyRepo.create(buildMondialTvRetryPolicy());
    const saved = await this.retryPolicyRepo.save(entity);
    this.logger.log(`Mondial TV RetryPolicy seeded: ${saved.id}`);
    return saved;
  }

  async seedReminderPolicy(): Promise<ReminderPolicyEntity> {
    const existing = await this.reminderPolicyRepo.findOne({
      where: { id: MONDIAL_TV_REMINDER_POLICY_ID },
    });

    if (existing) {
      this.logger.debug('Mondial TV ReminderPolicy seed already exists — skipping');
      return existing;
    }

    const entity = this.reminderPolicyRepo.create(buildMondialTvReminderPolicy());
    const saved = await this.reminderPolicyRepo.save(entity);
    this.logger.log(`Mondial TV ReminderPolicy seeded: ${saved.id}`);
    return saved;
  }
}

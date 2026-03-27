import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RetryScheduleEntity } from './retry-schedule.entity';
import { RetryAttemptEntity } from './retry-attempt.entity';
import { ReminderPolicyEntity } from './reminder-policy.entity';

export enum ReminderChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE_CALL = 'PHONE_CALL',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  POSTAL_MAIL = 'POSTAL_MAIL',
}

export enum ReminderStatus {
  REMINDER_PENDING = 'REMINDER_PENDING',
  REMINDER_SENT = 'REMINDER_SENT',
  REMINDER_DELIVERED = 'REMINDER_DELIVERED',
  REMINDER_FAILED = 'REMINDER_FAILED',
  REMINDER_CANCELLED = 'REMINDER_CANCELLED',
  REMINDER_BOUNCED = 'REMINDER_BOUNCED',
  REMINDER_OPENED = 'REMINDER_OPENED',
  REMINDER_CLICKED = 'REMINDER_CLICKED',
}

export enum ReminderTrigger {
  ON_AM04_RECEIVED = 'ON_AM04_RECEIVED',
  BEFORE_RETRY = 'BEFORE_RETRY',
  AFTER_RETRY_FAILED = 'AFTER_RETRY_FAILED',
  AFTER_ALL_RETRIES_EXHAUSTED = 'AFTER_ALL_RETRIES_EXHAUSTED',
  MANUAL = 'MANUAL',
}

@Entity('reminder')
@Index(['organisationId'])
@Index(['retryScheduleId'])
@Index(['clientId'])
@Index(['status'])
@Index(['plannedAt', 'status'])
@Index(['channel', 'status'])
export class ReminderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid' })
  societeId: string;

  @Column({ type: 'uuid' })
  retryScheduleId: string;

  @ManyToOne(() => RetryScheduleEntity, (schedule) => schedule.reminders)
  @JoinColumn({ name: 'retry_schedule_id' })
  schedule: RetryScheduleEntity;

  @Column({ type: 'uuid', nullable: true })
  retryAttemptId: string | null;

  @ManyToOne(() => RetryAttemptEntity)
  @JoinColumn({ name: 'retry_attempt_id' })
  attempt: RetryAttemptEntity;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  reminderPolicyId: string;

  @ManyToOne(() => ReminderPolicyEntity, (policy) => policy.reminders)
  @JoinColumn({ name: 'reminder_policy_id' })
  policy: ReminderPolicyEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  triggerRuleId: string | null;

  @Column({
    type: 'enum',
    enum: ReminderChannel,
  })
  channel: ReminderChannel;

  @Column({ type: 'varchar', length: 255 })
  templateId: string;

  @Column({ type: 'jsonb', default: '{}' })
  templateVariables: Record<string, string>;

  @Column({
    type: 'enum',
    enum: ReminderTrigger,
  })
  trigger: ReminderTrigger;

  @Column({ type: 'timestamptz' })
  plannedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.REMINDER_PENDING,
  })
  status: ReminderStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  providerName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryStatusRaw: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  errorCode: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { RetryPolicyEntity } from './retry-policy.entity';
import { RetryAttemptEntity } from './retry-attempt.entity';
import { ReminderEntity } from './reminder.entity';

export enum RetryEligibility {
  ELIGIBLE = 'ELIGIBLE',
  NOT_ELIGIBLE_REASON_CODE = 'NOT_ELIGIBLE_REASON_CODE',
  NOT_ELIGIBLE_MAX_ATTEMPTS = 'NOT_ELIGIBLE_MAX_ATTEMPTS',
  NOT_ELIGIBLE_PAYMENT_SETTLED = 'NOT_ELIGIBLE_PAYMENT_SETTLED',
  NOT_ELIGIBLE_CONTRACT_CANCELLED = 'NOT_ELIGIBLE_CONTRACT_CANCELLED',
  NOT_ELIGIBLE_MANDATE_REVOKED = 'NOT_ELIGIBLE_MANDATE_REVOKED',
  NOT_ELIGIBLE_CLIENT_BLOCKED = 'NOT_ELIGIBLE_CLIENT_BLOCKED',
  NOT_ELIGIBLE_MANUAL_CANCEL = 'NOT_ELIGIBLE_MANUAL_CANCEL',
}

@Entity('retry_schedule')
@Index(['organisationId', 'societeId'])
@Index(['clientId'])
@Index(['contratId'])
@Index(['originalPaymentId'])
@Index(['nextRetryDate', 'isResolved', 'eligibility'])
export class RetryScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'uuid' })
  societeId: string;

  @Column({ type: 'uuid' })
  originalPaymentId: string;

  @Column({ type: 'uuid' })
  scheduleId: string;

  @Column({ type: 'uuid', nullable: true })
  factureId: string | null;

  @Column({ type: 'uuid', nullable: true })
  contratId: string | null;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'varchar', length: 50 })
  rejectionCode: string;

  @Column({ type: 'varchar', length: 50 })
  rejectionRawCode: string;

  @Column({ type: 'text', nullable: true })
  rejectionMessage: string | null;

  @Column({ type: 'timestamptz' })
  rejectionDate: Date;

  @Column({ type: 'uuid' })
  retryPolicyId: string;

  @ManyToOne(() => RetryPolicyEntity, (policy) => policy.schedules)
  @JoinColumn({ name: 'retry_policy_id' })
  policy: RetryPolicyEntity;

  @Column({ type: 'bigint' })
  amountCents: string;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: RetryEligibility,
    default: RetryEligibility.ELIGIBLE,
  })
  eligibility: RetryEligibility;

  @Column({ type: 'text', nullable: true })
  eligibilityReason: string | null;

  @Column({ type: 'int', default: 0 })
  currentAttempt: number;

  @Column({ type: 'int' })
  maxAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  nextRetryDate: Date | null;

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'text', nullable: true })
  resolutionReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @OneToMany(() => RetryAttemptEntity, (attempt) => attempt.schedule)
  attempts: RetryAttemptEntity[];

  @OneToMany(() => ReminderEntity, (reminder) => reminder.schedule)
  reminders: ReminderEntity[];
}

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
import { RetryScheduleEntity } from '../../retry-schedule/entities/retry-schedule.entity';
import { RetryJobEntity } from '../../retry-job/entities/retry-job.entity';

export enum RetryAttemptStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

@Entity('retry_attempt')
@Index(['retryScheduleId', 'attemptNumber'], { unique: true })
@Index(['status'])
@Index(['plannedDate', 'status'])
export class RetryAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  retryScheduleId: string;

  @ManyToOne(() => RetryScheduleEntity, (schedule) => schedule.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retry_schedule_id' })
  schedule: RetryScheduleEntity;

  @Column({ type: 'int' })
  attemptNumber: number;

  @Column({ type: 'timestamptz' })
  plannedDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date | null;

  @Column({
    type: 'enum',
    enum: RetryAttemptStatus,
    default: RetryAttemptStatus.SCHEDULED,
  })
  status: RetryAttemptStatus;

  @Column({ type: 'uuid', nullable: true })
  paymentIntentId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pspPaymentId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  pspResponse: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  errorCode: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  newRejectionCode: string | null;

  @Column({ type: 'uuid', nullable: true })
  retryJobId: string | null;

  @ManyToOne(() => RetryJobEntity, (job) => job.attempts)
  @JoinColumn({ name: 'retry_job_id' })
  job: RetryJobEntity;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

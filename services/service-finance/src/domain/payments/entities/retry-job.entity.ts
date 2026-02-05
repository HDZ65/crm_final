import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RetryAttemptEntity } from './retry-attempt.entity';

export enum RetryJobStatus {
  JOB_PENDING = 'JOB_PENDING',
  JOB_RUNNING = 'JOB_RUNNING',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_FAILED = 'JOB_FAILED',
  JOB_PARTIAL = 'JOB_PARTIAL',
}

@Entity('retry_job')
@Index(['organisationId'])
@Index(['status'])
@Index(['targetDate'])
@Index(['organisationId', 'targetDate'])
export class RetryJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'date' })
  targetDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'time', default: '10:00:00' })
  cutoffTime: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({
    type: 'enum',
    enum: RetryJobStatus,
    default: RetryJobStatus.JOB_PENDING,
  })
  status: RetryJobStatus;

  @Column({ type: 'int', default: 0 })
  totalAttempts: number;

  @Column({ type: 'int', default: 0 })
  successfulAttempts: number;

  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ type: 'int', default: 0 })
  skippedAttempts: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  failedScheduleIds: string[];

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 255 })
  triggeredBy: string;

  @Column({ type: 'boolean', default: false })
  isManual: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RetryAttemptEntity, (attempt) => attempt.job)
  attempts: RetryAttemptEntity[];
}

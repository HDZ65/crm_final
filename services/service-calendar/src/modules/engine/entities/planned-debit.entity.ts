import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DebitBatch } from '../../configuration/entities/system-debit-configuration.entity';

export enum PlannedDateStatus {
  PLANNED = 'PLANNED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('planned_debit')
@Index(['organisationId', 'plannedDebitDate'])
@Index(['organisationId', 'status'])
@Index(['organisationId', 'plannedDebitDate', 'batch'])
export class PlannedDebitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid' })
  societeId: string;

  @Column({ type: 'uuid' })
  @Index()
  clientId: string;

  @Column({ type: 'uuid' })
  @Index()
  contratId: string;

  @Column({ type: 'uuid', nullable: true })
  scheduleId: string;

  @Column({ type: 'uuid', nullable: true })
  factureId: string;

  @Column({ type: 'date' })
  plannedDebitDate: Date;

  @Column({ type: 'date' })
  originalTargetDate: Date;

  @Column({ type: 'enum', enum: PlannedDateStatus, default: PlannedDateStatus.PLANNED })
  status: PlannedDateStatus;

  @Column({ type: 'enum', enum: DebitBatch, nullable: true })
  batch: DebitBatch;

  @Column({ type: 'bigint' })
  amountCents: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'jsonb' })
  resolvedConfig: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

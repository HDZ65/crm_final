import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { DebitBatch } from '../../configuration/entities/system-debit-configuration.entity.js';

@Entity('volume_forecast')
@Unique(['organisationId', 'societeId', 'year', 'month', 'day', 'batch'])
@Index(['organisationId', 'year', 'month'])
export class VolumeForecastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  societeId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  day: number;

  @Column({ type: 'enum', enum: DebitBatch, nullable: true })
  batch: DebitBatch;

  @Column({ type: 'int', default: 0 })
  expectedTransactionCount: number;

  @Column({ type: 'bigint', default: 0 })
  expectedAmountCents: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  actualTransactionCount: number;

  @Column({ type: 'bigint', nullable: true })
  actualAmountCents: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

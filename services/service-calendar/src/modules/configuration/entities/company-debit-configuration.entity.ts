import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from './system-debit-configuration.entity.js';

@Entity('company_debit_configuration')
export class CompanyDebitConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'uuid', unique: true })
  societeId: string;

  @Column({ type: 'enum', enum: DebitDateMode })
  mode: DebitDateMode;

  @Column({ type: 'enum', enum: DebitBatch, nullable: true })
  batch: DebitBatch;

  @Column({ type: 'int', nullable: true })
  fixedDay: number;

  @Column({ type: 'enum', enum: DateShiftStrategy, default: DateShiftStrategy.NEXT_BUSINESS_DAY })
  shiftStrategy: DateShiftStrategy;

  @Column({ type: 'uuid', nullable: true })
  holidayZoneId: string;

  @Column({ type: 'uuid', nullable: true })
  cutoffConfigId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

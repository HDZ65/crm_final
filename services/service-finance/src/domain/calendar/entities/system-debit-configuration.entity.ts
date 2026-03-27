import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DebitDateMode {
  BATCH = 'BATCH',
  FIXED_DAY = 'FIXED_DAY',
}

export enum DebitBatch {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  L4 = 'L4',
}

export enum DateShiftStrategy {
  NEXT_BUSINESS_DAY = 'NEXT_BUSINESS_DAY',
  PREVIOUS_BUSINESS_DAY = 'PREVIOUS_BUSINESS_DAY',
  NEXT_WEEK_SAME_DAY = 'NEXT_WEEK_SAME_DAY',
}

@Entity('system_debit_configuration')
export class SystemDebitConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  organisationId: string;

  @Column({ type: 'enum', enum: DebitDateMode })
  defaultMode: DebitDateMode;

  @Column({ type: 'enum', enum: DebitBatch, nullable: true })
  defaultBatch: DebitBatch;

  @Column({ type: 'int', nullable: true })
  defaultFixedDay: number;

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

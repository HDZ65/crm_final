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
import type { HolidayZoneEntity } from './holiday-zone.entity.js';

export enum HolidayType {
  PUBLIC = 'PUBLIC',
  BANK = 'BANK',
  REGIONAL = 'REGIONAL',
  COMPANY = 'COMPANY',
}

@Entity('holiday')
@Index(['holidayZoneId', 'date'])
export class HolidayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'holiday_zone_id', type: 'uuid' })
  holidayZoneId: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: HolidayType, default: HolidayType.PUBLIC })
  holidayType: HolidayType;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'int', nullable: true })
  recurringMonth: number;

  @Column({ type: 'int', nullable: true })
  recurringDay: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('HolidayZoneEntity', 'holidays')
  @JoinColumn({ name: 'holiday_zone_id' })
  holidayZone: HolidayZoneEntity;
}

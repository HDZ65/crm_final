import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { HolidayEntity } from './holiday.entity.js';

@Entity('holiday_zone')
export class HolidayZoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 2 })
  countryCode: string;

  @Column({ length: 10, nullable: true })
  regionCode: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => HolidayEntity, (holiday) => holiday.holidayZone)
  holidays: HolidayEntity[];
}

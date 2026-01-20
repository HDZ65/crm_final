import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum HolidayType {
  PUBLIC = 'PUBLIC',
  BANK = 'BANK',
  REGIONAL = 'REGIONAL',
  COMPANY = 'COMPANY',
}

@Entity('holiday')
export class HolidayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
}

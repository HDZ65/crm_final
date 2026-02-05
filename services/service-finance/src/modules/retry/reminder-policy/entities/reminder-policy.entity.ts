import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ReminderEntity } from '../../reminder/entities/reminder.entity';

export interface ReminderTriggerRule {
  id: string;
  trigger: string;
  channel: string;
  templateId: string;
  delayHours: number;
  daysBeforeRetry?: number;
  order: number;
  onlyIfNoResponse: boolean;
  onlyFirstRejection: boolean;
}

@Entity('reminder_policy')
@Index(['organisationId'])
@Index(['organisationId', 'isActive'])
export class ReminderPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  societeId: string | null;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  triggerRules: ReminderTriggerRule[];

  @Column({ type: 'int', default: 24 })
  cooldownHours: number;

  @Column({ type: 'int', default: 3 })
  maxRemindersPerDay: number;

  @Column({ type: 'int', default: 10 })
  maxRemindersPerWeek: number;

  @Column({ type: 'int', default: 9 })
  allowedStartHour: number;

  @Column({ type: 'int', default: 19 })
  allowedEndHour: number;

  @Column({ type: 'jsonb', default: '[1,2,3,4,5]' })
  allowedDaysOfWeek: number[];

  @Column({ type: 'boolean', default: true })
  respectOptOut: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ReminderEntity, (reminder) => reminder.policy)
  reminders: ReminderEntity[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SubscriptionPreferenceEntity } from './subscription-preference.entity';

export enum AppliedCycle {
  CURRENT = 'N',
  NEXT = 'N+1',
}

@Entity('subscription_preference_history')
@Index(['preferenceId', 'changedAt'])
export class SubscriptionPreferenceHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'preference_id', type: 'uuid' })
  @Index()
  preferenceId: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ name: 'new_value', type: 'text' })
  newValue: string;

  @Column({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;

  @Column({ name: 'changed_by', type: 'varchar', length: 255 })
  changedBy: string;

  @Column({
    name: 'applied_cycle',
    type: 'enum',
    enum: AppliedCycle,
    default: AppliedCycle.CURRENT,
  })
  appliedCycle: AppliedCycle;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => SubscriptionPreferenceEntity, (pref) => pref.history)
  @JoinColumn({ name: 'preference_id' })
  preference: SubscriptionPreferenceEntity;
}

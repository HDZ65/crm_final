import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum SubscriptionTriggeredBy {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  IMS = 'IMS',
  STORE = 'STORE',
  DUNNING = 'DUNNING',
}

@Entity('subscription_history')
export class SubscriptionHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'old_status', type: 'varchar', length: 50, nullable: true })
  oldStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({
    name: 'triggered_by',
    type: 'enum',
    enum: SubscriptionTriggeredBy,
    default: SubscriptionTriggeredBy.SYSTEM,
  })
  triggeredBy: SubscriptionTriggeredBy;

  @Column({ type: 'jsonb', nullable: true, default: null })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('SubscriptionEntity', 'history')
  @JoinColumn({ name: 'subscription_id' })
  subscription: any;
}

import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity('subscription_status_history')
export class SubscriptionStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'previous_status', type: 'varchar', length: 50, nullable: true })
  previousStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'changed_by', type: 'varchar', length: 255, nullable: true })
  changedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.statusHistory)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Relation<SubscriptionEntity>;
}

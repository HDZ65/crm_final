import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity('subscription_cycles')
export class SubscriptionCycleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'cycle_number', type: 'int' })
  cycleNumber: number;

  @Column({ name: 'period_start', type: 'timestamptz' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamptz' })
  periodEnd: Date;

  @Column({ name: 'charge_date', type: 'timestamptz', nullable: true })
  chargeDate: Date | null;

  @Column({ name: 'charge_status', type: 'varchar', length: 50, nullable: true })
  chargeStatus: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SubscriptionEntity, (sub) => sub.cycles)
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;
}

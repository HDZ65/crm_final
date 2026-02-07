import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SubscriptionLineEntity } from './subscription-line.entity';
import { SubscriptionHistoryEntity } from './subscription-history.entity';

@Entity('subscriptions')
@Index(['organisationId'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'contrat_id', type: 'uuid', nullable: true })
  contratId: string | null;

  @Column({ type: 'varchar', length: 50 })
  status: string; // PENDING, ACTIVE, PAUSED, PAST_DUE, CANCELED, EXPIRED

  @Column({ type: 'varchar', length: 50 })
  frequency: string; // WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, ANNUAL

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string;

  @Column({ name: 'start_date', type: 'varchar', length: 50 })
  startDate: string;

  @Column({ name: 'end_date', type: 'varchar', length: 50, nullable: true })
  endDate: string | null;

  @Column({ name: 'paused_at', type: 'varchar', length: 50, nullable: true })
  pausedAt: string | null;

  @Column({ name: 'resumed_at', type: 'varchar', length: 50, nullable: true })
  resumedAt: string | null;

  @Column({ name: 'next_charge_at', type: 'varchar', length: 50 })
  nextChargeAt: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SubscriptionLineEntity, (line) => line.subscription)
  lines: SubscriptionLineEntity[];

  @OneToMany(() => SubscriptionHistoryEntity, (hist) => hist.subscription)
  history: SubscriptionHistoryEntity[];
}

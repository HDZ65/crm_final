import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SubscriptionPlanType } from './subscription.entity';

@Entity('subscription_plans')
@Index(['organisationId'])
@Index(['organisationId', 'code'], { unique: true })
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlanType,
  })
  code: SubscriptionPlanType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 15, scale: 2, default: 0 })
  priceMonthly: number;

  @Column({ name: 'price_annual', type: 'decimal', precision: 15, scale: 2, default: 0 })
  priceAnnual: number;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string;

  @Column({ name: 'trial_days', type: 'int', default: 0 })
  trialDays: number;

  @Column({ name: 'features', type: 'jsonb', nullable: true, default: null })
  features: Record<string, unknown> | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

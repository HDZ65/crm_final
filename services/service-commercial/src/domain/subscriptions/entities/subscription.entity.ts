import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum SubscriptionPlanType {
  FREE_AVOD = 'FREE_AVOD',
  PREMIUM_SVOD = 'PREMIUM_SVOD',
  VIP = 'VIP',
}

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum SubscriptionFrequency {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum StoreSource {
  NONE = 'NONE',
  WEB_DIRECT = 'WEB_DIRECT',
  APPLE_STORE = 'APPLE_STORE',
  GOOGLE_STORE = 'GOOGLE_STORE',
  TV_STORE = 'TV_STORE',
  BOX = 'BOX',
}

@Entity('subscriptions')
@Index(['organisationId'])
@Index(['organisationId', 'clientId'])
@Index(['organisationId', 'status'])
@Index(['organisationId', 'nextChargeAt'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'plan_type',
    type: 'enum',
    enum: SubscriptionPlanType,
  })
  planType: SubscriptionPlanType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionFrequency,
  })
  frequency: SubscriptionFrequency;

  @Column({ name: 'trial_start', type: 'timestamptz', nullable: true })
  trialStart: Date | null;

  @Column({ name: 'trial_end', type: 'timestamptz', nullable: true })
  trialEnd: Date | null;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'next_charge_at', type: 'timestamptz', nullable: true })
  nextChargeAt: Date | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string;

  @Column({
    name: 'store_source',
    type: 'enum',
    enum: StoreSource,
    default: StoreSource.NONE,
  })
  storeSource: StoreSource;

  @Column({ name: 'ims_subscription_id', type: 'varchar', length: 255, nullable: true })
  imsSubscriptionId: string | null;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt: Date | null;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason: string | null;

  @Column({ name: 'add_ons', type: 'jsonb', nullable: true, default: null })
  addOns: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('SubscriptionLineEntity', 'subscription')
  lines: any[];

  @OneToMany('SubscriptionHistoryEntity', 'subscription')
  history: any[];

  @OneToMany('SubscriptionCycleEntity', 'subscription')
  cycles: any[];

  @OneToMany('SubscriptionStatusHistoryEntity', 'subscription')
  statusHistory: any[];

  // Backward-compatibility fields used by legacy subscription flows.
  contratId: string | null;

  retryCount: number;

  get startDate(): string {
    return this.currentPeriodStart ? this.currentPeriodStart.toISOString() : '';
  }

  set startDate(value: string) {
    this.currentPeriodStart = value ? new Date(value) : null;
  }

  get endDate(): string | null {
    return this.currentPeriodEnd ? this.currentPeriodEnd.toISOString() : null;
  }

  set endDate(value: string | null) {
    this.currentPeriodEnd = value ? new Date(value) : null;
  }

  get pausedAt(): string | null {
    return this.suspendedAt ? this.suspendedAt.toISOString() : null;
  }

  set pausedAt(value: string | null) {
    this.suspendedAt = value ? new Date(value) : null;
  }

  get resumedAt(): string | null {
    return null;
  }

  set resumedAt(_value: string | null) {
    // No-op for backward compatibility with legacy callers.
  }
}

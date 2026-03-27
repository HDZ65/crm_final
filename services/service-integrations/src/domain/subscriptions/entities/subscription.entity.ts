import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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
@Index(['keycloakGroupId'])
@Index(['keycloakGroupId', 'clientId'])
@Index(['keycloakGroupId', 'status'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'plan_type', type: 'enum', enum: SubscriptionPlanType })
  planType!: SubscriptionPlanType;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status!: SubscriptionStatus;

  @Column({ type: 'enum', enum: SubscriptionFrequency })
  frequency!: SubscriptionFrequency;

  @Column({ name: 'trial_start', type: 'timestamptz', nullable: true })
  trialStart!: Date | null;

  @Column({ name: 'trial_end', type: 'timestamptz', nullable: true })
  trialEnd!: Date | null;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart!: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd!: Date | null;

  @Column({ name: 'next_charge_at', type: 'timestamptz', nullable: true })
  nextChargeAt!: Date | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency!: string;

  @Column({ name: 'store_source', type: 'enum', enum: StoreSource, default: StoreSource.NONE })
  storeSource!: StoreSource;

  @Column({ name: 'ims_subscription_id', type: 'varchar', length: 255, nullable: true })
  imsSubscriptionId!: string | null;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId!: string | null;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt!: Date | null;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason!: string | null;

  @Column({ name: 'add_ons', type: 'jsonb', nullable: true, default: null })
  addOns!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

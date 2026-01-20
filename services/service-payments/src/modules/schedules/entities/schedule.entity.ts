import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ScheduleFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  GOCARDLESS = 'gocardless',
  SLIMPAY = 'slimpay',
  MULTISAFEPAY = 'multisafepay',
  EMERCHANTPAY = 'emerchantpay',
}


@Entity('schedules')
export class ScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  organisationId: string | null;

  @Column()
  @Index()
  clientId: string;

  @Column()
  @Index()
  societeId: string;


  @Column({ name: 'contrat_id', nullable: true })
  @Index()
  contratId: string;

  @Column({ name: 'facture_id', nullable: true })
  @Index()
  factureId: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @Column({ name: 'provider_account_id' })
  providerAccountId: string;

  @Column({ name: 'provider_subscription_id', nullable: true })
  providerSubscriptionId: string;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ScheduleFrequency,
    default: ScheduleFrequency.MONTHLY,
  })
  frequency: ScheduleFrequency;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE,
  })
  status: ScheduleStatus;

  @Column({ nullable: true })
  plannedDebitDate: Date;

  @Column({ nullable: true })
  nextPaymentDate: Date;

  @Column({ nullable: true })
  lastPaymentDate: Date;


  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date', nullable: true })
  endDate: Date;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isActive(): boolean {
    return this.status === ScheduleStatus.ACTIVE;
  }

  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  incrementRetry(): void {
    this.retryCount++;
  }

  resetRetryCount(): void {
    this.retryCount = 0;
  }
}

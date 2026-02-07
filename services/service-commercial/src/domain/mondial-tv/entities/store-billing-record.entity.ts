import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StoreSource {
  APPLE_STORE = 'APPLE_STORE',
  GOOGLE_STORE = 'GOOGLE_STORE',
  TV_STORE = 'TV_STORE',
}

export enum StoreBillingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum StoreEventType {
  INITIAL_PURCHASE = 'INITIAL_PURCHASE',
  RENEWAL = 'RENEWAL',
  CANCELLATION = 'CANCELLATION',
  REFUND = 'REFUND',
}

@Entity('store_billing_records')
@Index(['organisationId', 'subscriptionId'])
@Index(['organisationId', 'clientId'])
@Index(['organisationId', 'storeSource'])
@Index(['storeSource', 'storeTransactionId'], { unique: true })
@Index(['organisationId', 'status'])
export class StoreBillingRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'store_source',
    type: 'enum',
    enum: StoreSource,
  })
  storeSource: StoreSource;

  @Column({
    name: 'store_transaction_id',
    type: 'varchar',
    length: 255,
  })
  storeTransactionId: string;

  @Column({
    name: 'store_product_id',
    type: 'varchar',
    length: 255,
  })
  storeProductId: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: StoreBillingStatus,
    default: StoreBillingStatus.PENDING,
  })
  status: StoreBillingStatus;

  @Column({
    name: 'receipt_data',
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  receiptData: Record<string, any> | null;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: StoreEventType,
  })
  eventType: StoreEventType;

  @Column({
    name: 'original_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  originalTransactionId: string | null;

  @Column({ name: 'event_date', type: 'timestamptz' })
  eventDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isPaid(): boolean {
    return this.status === StoreBillingStatus.PAID;
  }

  isFailed(): boolean {
    return this.status === StoreBillingStatus.FAILED;
  }

  isRefunded(): boolean {
    return this.status === StoreBillingStatus.REFUNDED;
  }

  isPending(): boolean {
    return this.status === StoreBillingStatus.PENDING;
  }

  markPaid(): void {
    this.status = StoreBillingStatus.PAID;
  }

  markFailed(): void {
    this.status = StoreBillingStatus.FAILED;
  }

  markRefunded(): void {
    this.status = StoreBillingStatus.REFUNDED;
  }

  isRenewal(): boolean {
    return this.eventType === StoreEventType.RENEWAL;
  }

  isInitialPurchase(): boolean {
    return this.eventType === StoreEventType.INITIAL_PURCHASE;
  }
}

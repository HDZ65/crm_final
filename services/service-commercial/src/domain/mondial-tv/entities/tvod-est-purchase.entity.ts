import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PurchaseType {
  TVOD = 'TVOD',
  EST = 'EST',
}

export enum PaymentMethod {
  CB_DIRECT = 'CB_DIRECT',
  APPLE_STORE = 'APPLE_STORE',
  GOOGLE_STORE = 'GOOGLE_STORE',
}

export enum StoreSource {
  DIRECT = 'DIRECT',
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}

@Entity('tvod_est_purchases')
@Index(['organisationId', 'clientId'])
@Index(['organisationId', 'contentId'])
@Index(['organisationId', 'status'])
@Index(['clientId', 'createdAt'])
export class TvodEstPurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  @Column({ name: 'content_id', type: 'varchar', length: 255 })
  contentId: string; // IMS content ID

  @Column({ name: 'content_title', type: 'varchar', length: 500 })
  contentTitle: string;

  @Column({
    name: 'purchase_type',
    type: 'enum',
    enum: PurchaseType,
  })
  purchaseType: PurchaseType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    name: 'store_source',
    type: 'enum',
    enum: StoreSource,
    enumName: 'tvod_store_source_enum',
  })
  storeSource: StoreSource;

  @Column({ name: 'store_transaction_id', type: 'varchar', length: 255, nullable: true })
  storeTransactionId: string | null;

  @Column({ name: 'ims_transaction_id', type: 'varchar', length: 255 })
  imsTransactionId: string;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null; // Link to service-finance

  @Column({
    name: 'status',
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  refundAmount: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

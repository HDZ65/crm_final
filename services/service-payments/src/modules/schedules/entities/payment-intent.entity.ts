import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScheduleEntity, PaymentProvider } from './schedule.entity.js';

export enum PaymentIntentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('payment_intents')
export class PaymentIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'schedule_id', nullable: true })
  @Index()
  scheduleId: string;

  @ManyToOne(() => ScheduleEntity, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: ScheduleEntity;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column({ name: 'facture_id', nullable: true })
  @Index()
  factureId: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @Column({ name: 'provider_payment_id', nullable: true, unique: true })
  providerPaymentId: string;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.PENDING,
  })
  status: PaymentIntentStatus;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'refunded_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ unique: true, nullable: true })
  @Index()
  idempotencyKey: string;

  @Column({ nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isPaid(): boolean {
    return this.status === PaymentIntentStatus.SUCCEEDED;
  }

  canRefund(): boolean {
    return (
      this.status === PaymentIntentStatus.SUCCEEDED &&
      this.refundedAmount < this.amount
    );
  }

  getRemainingRefundableAmount(): number {
    return Number(this.amount) - Number(this.refundedAmount);
  }
}

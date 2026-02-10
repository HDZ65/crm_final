import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PaymentIntentStatus } from './payment-intent.entity';
import { PaymentProvider } from './schedule.entity';

/**
 * PaymentArchiveEntity — Read-only archive of finalized payments.
 * Mirrors PaymentIntentEntity structure with additional archival metadata.
 * Table: payment_archives
 *
 * CDC Section 3.4 & Annexe F.3:
 * - Payments with final status (SUCCEEDED, REFUNDED, CANCELLED, FAILED) archived after J+30
 * - Archived payments are read-only, excluded from retry/routing/scoring jobs
 * - Configurable retention per company (default: 30 days)
 */
@Entity('payment_archives')
@Index(['societeId', 'archivedAt'])
export class PaymentArchiveEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Archival metadata ──────────────────────────────────────────────

  @Column({ name: 'original_payment_id', type: 'uuid' })
  @Index()
  originalPaymentId: string;

  @Column({ name: 'archived_at', type: 'timestamptz' })
  archivedAt: Date;

  @Column({ name: 'archived_by', default: 'SYSTEM' })
  archivedBy: string;

  // ── Copied from PaymentIntentEntity ────────────────────────────────

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column({ name: 'facture_id', nullable: true })
  factureId: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @Column({ name: 'provider_payment_id', nullable: true })
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
  })
  status: PaymentIntentStatus;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'refunded_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  idempotencyKey: string;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ name: 'original_created_at', type: 'timestamptz' })
  originalCreatedAt: Date;

  @Column({ name: 'original_updated_at', type: 'timestamptz' })
  originalUpdatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ── Read-only business methods ─────────────────────────────────────

  isPaid(): boolean {
    return this.status === PaymentIntentStatus.SUCCEEDED;
  }

  isRefunded(): boolean {
    return this.status === PaymentIntentStatus.REFUNDED;
  }

  isFinalStatus(): boolean {
    return [
      PaymentIntentStatus.SUCCEEDED,
      PaymentIntentStatus.FAILED,
      PaymentIntentStatus.CANCELLED,
      PaymentIntentStatus.REFUNDED,
    ].includes(this.status);
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEventStatus {
  RECEIVED = 'RECEIVED',
  VERIFIED = 'VERIFIED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
}

@Entity('woocommerce_webhook_events')
@Index('idx_wc_event_unique', ['source', 'externalEventId'], { unique: true })
@Index('idx_wc_event_org_status', ['organisationId', 'status'])
@Index('idx_wc_event_type_created', ['eventType', 'createdAt'])
@Index('idx_wc_event_status_received', ['status', 'receivedAt'])
export class WooCommerceWebhookEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'source', type: 'varchar', length: 50, default: 'woocommerce' })
  source: string;

  @Column({ name: 'external_event_id', type: 'varchar', length: 255 })
  externalEventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'woo_resource_id', type: 'varchar', length: 255 })
  wooResourceId: string;

  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload: Record<string, any>;

  @Column({ type: 'varchar', nullable: true, length: 512 })
  signature: string | null;

  @Column({
    type: 'enum',
    enum: WebhookEventStatus,
    default: WebhookEventStatus.RECEIVED,
  })
  status: WebhookEventStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'received_at', type: 'timestamptz', default: () => 'NOW()' })
  receivedAt: Date;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ============================================================================
  // DOMAIN METHODS (following PSPEventInboxEntity pattern)
  // ============================================================================

  isProcessed(): boolean {
    return this.status === WebhookEventStatus.PROCESSED;
  }

  isDuplicate(): boolean {
    return this.status === WebhookEventStatus.DUPLICATE;
  }

  markVerified(): void {
    this.status = WebhookEventStatus.VERIFIED;
    this.verifiedAt = new Date();
  }

  markProcessing(): void {
    this.status = WebhookEventStatus.PROCESSING;
  }

  markProcessed(): void {
    this.status = WebhookEventStatus.PROCESSED;
    this.processedAt = new Date();
  }

  markFailed(errorMessage: string): void {
    this.status = WebhookEventStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  markDuplicate(): void {
    this.status = WebhookEventStatus.DUPLICATE;
  }
}

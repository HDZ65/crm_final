import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

export enum WebhookEventStatus {
  RECEIVED = 'RECEIVED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
}

@Entity('depanssur_webhook_event_log')
@Index('idx_depanssur_webhook_event_id', ['eventId'], { unique: true })
@Index('idx_depanssur_webhook_status', ['status', 'receivedAt'])
@Index('idx_depanssur_webhook_event_type', ['eventType'])
export class WebhookEventLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'varchar', length: 255 })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 128 })
  eventType: string;

  @Column({ name: 'raw_payload', type: 'text' })
  rawPayload: string;

  @Column({ name: 'signature', type: 'varchar', length: 512, nullable: true })
  signature: string | null;

  @Column({
    type: 'enum',
    enum: WebhookEventStatus,
    default: WebhookEventStatus.RECEIVED,
  })
  status: WebhookEventStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'received_at', type: 'timestamptz', default: () => 'NOW()' })
  receivedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  isProcessed(): boolean {
    return this.status === WebhookEventStatus.PROCESSED;
  }

  isDuplicate(): boolean {
    return this.status === WebhookEventStatus.DUPLICATE;
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

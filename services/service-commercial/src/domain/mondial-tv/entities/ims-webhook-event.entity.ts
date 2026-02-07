import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ImsWebhookProcessingStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity('ims_webhook_events')
@Index('idx_ims_webhook_event_unique', ['eventId'], { unique: true })
@Index('idx_ims_webhook_event_org_status', ['organisationId', 'processingStatus'])
@Index('idx_ims_webhook_event_type_created', ['eventType', 'createdAt'])
export class ImsWebhookEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index('idx_ims_webhook_event_org')
  organisationId: string;

  @Column({ name: 'event_id', type: 'varchar', length: 255 })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ name: 'hmac_valid', type: 'boolean', default: false })
  hmacValid: boolean;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: ImsWebhookProcessingStatus,
    default: ImsWebhookProcessingStatus.RECEIVED,
  })
  processingStatus: ImsWebhookProcessingStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  markProcessing(): void {
    this.processingStatus = ImsWebhookProcessingStatus.PROCESSING;
    this.errorMessage = null;
  }

  markDone(processedAt: Date = new Date()): void {
    this.processingStatus = ImsWebhookProcessingStatus.DONE;
    this.processedAt = processedAt;
    this.errorMessage = null;
  }

  markFailed(errorMessage: string): void {
    this.processingStatus = ImsWebhookProcessingStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  incrementRetry(): void {
    this.retryCount = Number(this.retryCount || 0) + 1;
  }
}

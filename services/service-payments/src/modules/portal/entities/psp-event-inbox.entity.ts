import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PortalPaymentSessionEntity, PSPProvider } from './portal-session.entity.js';

export enum WebhookEventStatus {
  RECEIVED = 'RECEIVED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
}

@Entity('psp_event_inbox')
@Index('idx_psp_event_unique', ['pspProvider', 'pspEventId'], { unique: true })
@Index('idx_psp_event_session', ['portalSessionId'])
@Index('idx_psp_event_status', ['status', 'receivedAt'])
export class PSPEventInboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PSPProvider })
  pspProvider: PSPProvider;

  @Column({ length: 255 })
  pspEventId: string;

  @Column({ type: 'varchar', nullable: true, length: 128 })
  pspEventType: string | null;

  @Column({ type: 'uuid', nullable: true })
  portalSessionId: string | null;

  @ManyToOne(() => PortalPaymentSessionEntity, { nullable: true })
  @JoinColumn({ name: 'portal_session_id' })
  portalSession: PortalPaymentSessionEntity | null;

  @Column({ type: 'varchar', nullable: true })
  paymentIntentId: string | null;

  @Column({ type: 'text' })
  rawPayload: string;

  @Column({ type: 'varchar', nullable: true, length: 512 })
  signature: string | null;

  @Column({
    type: 'enum',
    enum: WebhookEventStatus,
    default: WebhookEventStatus.RECEIVED,
  })
  status: WebhookEventStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

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

  markProcessed(): void {
    this.status = WebhookEventStatus.PROCESSED;
    this.processedAt = new Date();
  }

  markRejected(errorMessage: string): void {
    this.status = WebhookEventStatus.REJECTED;
    this.errorMessage = errorMessage;
  }

  markFailed(errorMessage: string): void {
    this.status = WebhookEventStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  markDuplicate(): void {
    this.status = WebhookEventStatus.DUPLICATE;
  }
}

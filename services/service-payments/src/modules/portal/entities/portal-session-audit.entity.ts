import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PortalPaymentSessionEntity } from './portal-session.entity.js';

export enum AuditEventType {
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_ACCESSED = 'SESSION_ACCESSED',
  SESSION_ACTIVATED = 'SESSION_ACTIVATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
  REDIRECT_INITIATED = 'REDIRECT_INITIATED',
  REDIRECT_COMPLETED = 'REDIRECT_COMPLETED',
  CALLBACK_RECEIVED = 'CALLBACK_RECEIVED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_VERIFIED = 'WEBHOOK_VERIFIED',
  WEBHOOK_REJECTED = 'WEBHOOK_REJECTED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  TOKEN_VALIDATED = 'TOKEN_VALIDATED',
  TOKEN_REJECTED = 'TOKEN_REJECTED',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  REPLAY_DETECTED = 'REPLAY_DETECTED',
}

export enum AuditActorType {
  PORTAL_TOKEN = 'PORTAL_TOKEN',
  AUTHENTICATED_USER = 'AUTHENTICATED_USER',
  ADMIN = 'ADMIN',
  WEBHOOK = 'WEBHOOK',
  SYSTEM = 'SYSTEM',
}

@Entity('portal_session_audit')
@Index('idx_portal_audit_session', ['portalSessionId', 'createdAt'])
@Index('idx_portal_audit_event_type', ['eventType', 'createdAt'])
export class PortalSessionAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  portalSessionId: string;

  @ManyToOne(() => PortalPaymentSessionEntity)
  @JoinColumn({ name: 'portal_session_id' })
  portalSession: PortalPaymentSessionEntity;

  @Column({ type: 'enum', enum: AuditEventType })
  eventType: AuditEventType;

  @Column({ type: 'enum', enum: AuditActorType })
  actorType: AuditActorType;

  @Column({ nullable: true, length: 64 })
  @Index('idx_portal_audit_request_id')
  requestId: string | null;

  @Column({ nullable: true, length: 64 })
  correlationId: string | null;

  @Column({ nullable: true, length: 64 })
  ipAddressHash: string | null;

  @Column({ nullable: true, length: 64 })
  userAgentHash: string | null;

  @Column({ nullable: true, length: 2 })
  geoCountry: string | null;

  @Column({ nullable: true, length: 32 })
  previousStatus: string | null;

  @Column({ nullable: true, length: 32 })
  newStatus: string | null;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, string>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

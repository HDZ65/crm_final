import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentIntentEntity } from './payment-intent.entity';
import { PaymentProvider } from './schedule.entity';

export enum PaymentEventType {
  // Intent events
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELLED = 'payment.cancelled',

  // Refund events
  REFUND_CREATED = 'refund.created',
  REFUND_SUCCEEDED = 'refund.succeeded',
  REFUND_FAILED = 'refund.failed',

  // Schedule events
  SCHEDULE_CREATED = 'schedule.created',
  SCHEDULE_UPDATED = 'schedule.updated',
  SCHEDULE_PAUSED = 'schedule.paused',
  SCHEDULE_RESUMED = 'schedule.resumed',
  SCHEDULE_CANCELLED = 'schedule.cancelled',

  // Mandate events (GoCardless)
  MANDATE_CREATED = 'mandate.created',
  MANDATE_ACTIVE = 'mandate.active',
  MANDATE_FAILED = 'mandate.failed',
  MANDATE_CANCELLED = 'mandate.cancelled',

  // Webhook events
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_PROCESSED = 'webhook.processed',
  WEBHOOK_FAILED = 'webhook.failed',
}

@Entity('payment_events')
export class PaymentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_intent_id', nullable: true })
  @Index()
  paymentIntentId: string;

  @ManyToOne(() => PaymentIntentEntity, { nullable: true })
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent: PaymentIntentEntity;

  @Column({ name: 'schedule_id', nullable: true })
  @Index()
  scheduleId: string;

  @Column({ name: 'societe_id' })
  @Index()
  societeId: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    nullable: true,
  })
  provider: PaymentProvider;

  @Column({
    type: 'enum',
    enum: PaymentEventType,
  })
  @Index()
  eventType: PaymentEventType;

  @Column({ name: 'provider_event_id', nullable: true })
  providerEventId: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}

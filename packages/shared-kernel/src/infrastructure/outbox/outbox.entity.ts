import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Outbox event status
 */
export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

/**
 * Outbox Event Entity
 *
 * Implements the Transactional Outbox pattern for reliable event publishing.
 * Events are written to this table within the same transaction as the business operation,
 * then a separate process publishes them to NATS.
 *
 * @see https://microservices.io/patterns/data/transactional-outbox.html
 */
@Entity('outbox_events')
@Index(['status', 'createdAt'])
@Index(['aggregateType', 'aggregateId'])
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Event type (e.g., 'ContractSigned', 'PaymentReceived')
   */
  @Column({ type: 'varchar', length: 100 })
  @Index()
  eventType!: string;

  /**
   * NATS subject to publish to
   */
  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  /**
   * Serialized event payload (JSON)
   */
  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  /**
   * Aggregate type (e.g., 'Contract', 'Payment')
   */
  @Column({ type: 'varchar', length: 100 })
  aggregateType!: string;

  /**
   * Aggregate ID
   */
  @Column({ type: 'uuid' })
  aggregateId!: string;

  /**
   * Event status
   */
  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  @Index()
  status!: OutboxEventStatus;

  /**
   * Correlation ID for tracing
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId?: string;

  /**
   * Causation ID (event that caused this event)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  causationId?: string;

  /**
   * Number of publish attempts
   */
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  /**
   * Maximum retry attempts before marking as failed
   */
  @Column({ type: 'int', default: 5 })
  maxAttempts!: number;

  /**
   * Last error message if failed
   */
  @Column({ type: 'text', nullable: true })
  lastError?: string;

  /**
   * Timestamp when event was published
   */
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  /**
   * Next retry timestamp for exponential backoff
   */
  @Column({ type: 'timestamptz', nullable: true })
  nextRetryAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

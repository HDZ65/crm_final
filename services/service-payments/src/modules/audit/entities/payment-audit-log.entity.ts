import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  MANDATE_CREATED = 'MANDATE_CREATED',
  MANDATE_ACTIVATED = 'MANDATE_ACTIVATED',
  MANDATE_CANCELLED = 'MANDATE_CANCELLED',
  SCHEDULE_CREATED = 'SCHEDULE_CREATED',
  SCHEDULE_PAUSED = 'SCHEDULE_PAUSED',
  SCHEDULE_RESUMED = 'SCHEDULE_RESUMED',
  SCHEDULE_CANCELLED = 'SCHEDULE_CANCELLED',
  EMISSION_STARTED = 'EMISSION_STARTED',
  EMISSION_COMPLETED = 'EMISSION_COMPLETED',
}

@Entity('payment_audit_logs')
@Index(['societeId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['actorId', 'createdAt'])
export class PaymentAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  societeId: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  actorId: string | null;

  @Column({ type: 'varchar', nullable: true })
  actorType: 'user' | 'system' | 'webhook' | null;

  @Column({ type: 'varchar', nullable: true })
  actorIp: string | null;

  @Column({ type: 'jsonb', nullable: true })
  previousState: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newState: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  correlationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}

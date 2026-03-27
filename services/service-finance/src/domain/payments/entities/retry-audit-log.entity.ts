import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

export enum RetryAuditActorType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  SCHEDULER = 'SCHEDULER',
  WEBHOOK = 'WEBHOOK',
}

@Entity('retry_audit_log')
@Index(['organisationId'])
@Index(['entityType', 'entityId'])
@Index(['retryScheduleId'])
@Index(['timestamp'])
@Index(['action'])
@Index(['actorType', 'actorId'])
export class RetryAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb' })
  newValue: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  changedFields: string | null;

  @Column({ type: 'uuid', nullable: true })
  retryScheduleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  retryAttemptId: string | null;

  @Column({ type: 'uuid', nullable: true })
  reminderId: string | null;

  @Column({ type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({
    type: 'enum',
    enum: RetryAuditActorType,
  })
  actorType: RetryAuditActorType;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'inet', nullable: true })
  actorIp: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp: Date;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;
}

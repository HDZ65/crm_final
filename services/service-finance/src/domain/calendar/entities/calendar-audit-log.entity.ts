import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CalendarAuditSource {
  UI = 'UI',
  CSV_IMPORT = 'CSV_IMPORT',
  API = 'API',
  SYSTEM = 'SYSTEM',
}

@Entity('calendar_audit_log')
@Index(['organisationId', 'entityType', 'entityId'])
@Index(['organisationId', 'createdAt'])
export class CalendarAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ length: 50 })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ length: 20 })
  action: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  actorUserId: string;

  @Column({ type: 'enum', enum: CalendarAuditSource })
  source: CalendarAuditSource;

  @Column({ type: 'jsonb', nullable: true })
  beforeState: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  afterState: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  changeSummary: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

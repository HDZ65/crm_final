import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  COMMISSION_CALCULATED = 'commission_calculated',
  COMMISSION_CREATED = 'commission_created',
  COMMISSION_UPDATED = 'commission_updated',
  COMMISSION_DELETED = 'commission_deleted',
  COMMISSION_STATUS_CHANGED = 'commission_status_changed',
  
  RECURRENCE_GENERATED = 'recurrence_generated',
  RECURRENCE_STOPPED = 'recurrence_stopped',
  
  REPRISE_CREATED = 'reprise_created',
  REPRISE_APPLIED = 'reprise_applied',
  REPRISE_CANCELLED = 'reprise_cancelled',
  REPRISE_REGULARIZED = 'reprise_regularized',
  
  REPORT_NEGATIF_CREATED = 'report_negatif_created',
  REPORT_NEGATIF_APPLIED = 'report_negatif_applied',
  REPORT_NEGATIF_CLEARED = 'report_negatif_cleared',
  
  BORDEREAU_CREATED = 'bordereau_created',
  BORDEREAU_VALIDATED = 'bordereau_validated',
  BORDEREAU_EXPORTED = 'bordereau_exported',
  BORDEREAU_ARCHIVED = 'bordereau_archived',
  
  LIGNE_SELECTED = 'ligne_selected',
  LIGNE_DESELECTED = 'ligne_deselected',
  LIGNE_VALIDATED = 'ligne_validated',
  LIGNE_REJECTED = 'ligne_rejected',
  
  BAREME_CREATED = 'bareme_created',
  BAREME_UPDATED = 'bareme_updated',
  BAREME_ACTIVATED = 'bareme_activated',
  BAREME_DEACTIVATED = 'bareme_deactivated',
  BAREME_VERSION_CREATED = 'bareme_version_created',
  
  PALIER_CREATED = 'palier_created',
  PALIER_UPDATED = 'palier_updated',
  PALIER_DELETED = 'palier_deleted',
}

export enum AuditScope {
  COMMISSION = 'commission',
  RECURRENCE = 'recurrence',
  REPRISE = 'reprise',
  REPORT = 'report',
  BORDEREAU = 'bordereau',
  LIGNE = 'ligne',
  BAREME = 'bareme',
  PALIER = 'palier',
  ENGINE = 'engine',
}

@Entity('commission_audit_logs')
@Index(['organisationId', 'createdAt'])
@Index(['scope', 'refId'])
@Index(['action', 'createdAt'])
export class CommissionAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'enum', enum: AuditScope })
  scope: AuditScope;

  @Column({ name: 'ref_id', type: 'uuid', nullable: true })
  refId: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'before_data', type: 'jsonb', nullable: true })
  beforeData: Record<string, any> | null;

  @Column({ name: 'after_data', type: 'jsonb', nullable: true })
  afterData: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'user_id', type: 'varchar', length: 255, nullable: true })
  userId: string | null;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @Column({ name: 'bareme_id', type: 'uuid', nullable: true })
  baremeId: string | null;

  @Column({ name: 'bareme_version', type: 'int', nullable: true })
  baremeVersion: number | null;

  @Column({ name: 'contrat_id', type: 'uuid', nullable: true })
  contratId: string | null;

  @Column({ name: 'apporteur_id', type: 'uuid', nullable: true })
  apporteurId: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  periode: string | null;

  @Column({ name: 'montant_calcule', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montantCalcule: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

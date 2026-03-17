import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('document_audit_logs')
@Index(['organisationId', 'timestamp'])
@Index(['documentId', 'timestamp'])
export class DocumentAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255, nullable: true })
  userId: string | null;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;
}

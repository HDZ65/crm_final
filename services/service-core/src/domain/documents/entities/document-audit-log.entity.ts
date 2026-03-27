import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('document_audit_logs')
@Index(['keycloakGroupId', 'timestamp'])
@Index(['documentId', 'timestamp'])
export class DocumentAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  @Index()
  keycloakGroupId: string;

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

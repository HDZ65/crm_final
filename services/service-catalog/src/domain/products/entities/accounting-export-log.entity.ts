import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AccountingExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Entity('accounting_export_log')
@Index(['keycloakGroupId', 'period'])
@Index(['generatedAt'])
export class AccountingExportLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  /** Format YYYY-MM */
  @Column({ type: 'varchar', length: 7 })
  period: string;

  @Column({ type: 'enum', enum: AccountingExportFormat, default: AccountingExportFormat.CSV })
  format: AccountingExportFormat;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 96 })
  fileHash: string;

  @Column({ name: 'file_size_bytes', type: 'int', default: 0 })
  fileSizeBytes: number;

  @Column({ name: 'row_count', type: 'int', default: 0 })
  rowCount: number;

  @Column({ name: 'storage_path', type: 'text', nullable: true })
  storagePath: string | null;

  @Column({ name: 's3_url', type: 'text', nullable: true })
  s3Url: string | null;

  @Column({ name: 'generated_by', type: 'varchar', length: 60, default: 'SYSTEM_CRON' })
  generatedBy: string;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt: Date;
}

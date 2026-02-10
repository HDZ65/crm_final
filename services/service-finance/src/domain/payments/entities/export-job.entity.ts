import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
  JSON = 'JSON',
}

export enum ExportJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity('export_jobs')
@Index(['companyId', 'status'])
export class ExportJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'period_from', type: 'date' })
  periodFrom: Date;

  @Column({ name: 'period_to', type: 'date' })
  periodTo: Date;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({
    type: 'enum',
    enum: ExportJobStatus,
    default: ExportJobStatus.PENDING,
  })
  status: ExportJobStatus;

  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  fileId: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isComplete(): boolean {
    return this.status === ExportJobStatus.DONE || this.status === ExportJobStatus.FAILED;
  }
}

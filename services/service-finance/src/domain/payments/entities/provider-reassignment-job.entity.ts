import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReassignmentJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('provider_reassignment_jobs')
export class ProviderReassignmentJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'from_provider_account_id', type: 'uuid' })
  fromProviderAccountId: string;

  @Column({ name: 'to_provider_account_id', type: 'uuid' })
  toProviderAccountId: string;

  @Column({ name: 'selection_query', type: 'jsonb', default: '{}' })
  selectionQuery: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ReassignmentJobStatus,
    default: ReassignmentJobStatus.PENDING,
  })
  status: ReassignmentJobStatus;

  @Column({ name: 'dry_run', default: false })
  dryRun: boolean;

  @Column({ name: 'report_file_id', type: 'uuid', nullable: true })
  reportFileId: string | null;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount: number;

  @Column({ name: 'processed_count', type: 'int', default: 0 })
  processedCount: number;

  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isComplete(): boolean {
    return this.status === ReassignmentJobStatus.DONE || this.status === ReassignmentJobStatus.FAILED;
  }

  getProgressPercent(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.processedCount / this.totalCount) * 100);
  }
}

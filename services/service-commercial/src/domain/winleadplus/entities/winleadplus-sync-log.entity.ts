import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WinLeadPlusSyncStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('winleadplus_sync_logs')
@Index(['organisationId', 'startedAt'])
export class WinLeadPlusSyncLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({
    type: 'enum',
    enum: WinLeadPlusSyncStatus,
    default: WinLeadPlusSyncStatus.RUNNING,
  })
  status: WinLeadPlusSyncStatus;

  @Column({ name: 'total_prospects', type: 'int', default: 0 })
  totalProspects: number;

  @Column({ type: 'int', default: 0 })
  created: number;

  @Column({ type: 'int', default: 0 })
  updated: number;

  @Column({ type: 'int', default: 0 })
  skipped: number;

  @Column({ type: 'jsonb', default: '[]' })
  errors: Record<string, any>[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ============================================================================
  // DOMAIN METHODS
  // ============================================================================

  markSuccess(): void {
    this.status = WinLeadPlusSyncStatus.SUCCESS;
    this.finishedAt = new Date();
  }

  markFailed(error?: Record<string, any>): void {
    this.status = WinLeadPlusSyncStatus.FAILED;
    this.finishedAt = new Date();
    if (error) {
      this.errors = [...this.errors, error];
    }
  }

  isRunning(): boolean {
    return this.status === WinLeadPlusSyncStatus.RUNNING;
  }
}

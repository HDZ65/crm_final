import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('winleadplus_configs')
export class WinLeadPlusConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid', unique: true })
  @Index()
  organisationId: string;

  @Column({ name: 'api_endpoint', type: 'varchar', length: 500 })
  apiEndpoint: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'sync_interval_minutes', type: 'int', default: 60 })
  syncIntervalMinutes: number;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

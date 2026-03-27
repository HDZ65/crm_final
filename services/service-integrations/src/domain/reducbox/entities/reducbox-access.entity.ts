import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { ReducBoxAccessHistoryEntity } from './reducbox-access-history.entity';

export enum ReducBoxAccessStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

@Entity('reducbox_access')
@Index(['clientId'])
@Index(['contratId'])
@Index(['status'])
export class ReducBoxAccessEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId!: string;

  @Column({
    type: 'enum',
    enum: ReducBoxAccessStatus,
    default: ReducBoxAccessStatus.PENDING,
  })
  status!: ReducBoxAccessStatus;

  @Column({ name: 'external_access_id', type: 'varchar', length: 255, nullable: true })
  externalAccessId!: string | null;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt!: Date | null;

  @Column({ name: 'restored_at', type: 'timestamptz', nullable: true })
  restoredAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ReducBoxAccessHistoryEntity, (history) => history.access)
  history!: Relation<ReducBoxAccessHistoryEntity[]>;

  // Business helpers
  isActive(): boolean {
    return this.status === ReducBoxAccessStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this.status === ReducBoxAccessStatus.SUSPENDED;
  }

  isCancelled(): boolean {
    return this.status === ReducBoxAccessStatus.CANCELLED;
  }

  isPending(): boolean {
    return this.status === ReducBoxAccessStatus.PENDING;
  }
}

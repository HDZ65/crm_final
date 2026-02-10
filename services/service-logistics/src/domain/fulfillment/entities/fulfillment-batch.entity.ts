import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FulfillmentBatchStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  DISPATCHED = 'DISPATCHED',
  COMPLETED = 'COMPLETED',
}

@Entity('fulfillment_batches')
export class FulfillmentBatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

   @Column({ name: 'organisation_id', type: 'uuid' })
   @Index()
   organisationId: string;

   @Column({ name: 'societe_id', type: 'uuid' })
   societeId: string;

  @Column({
    type: 'enum',
    enum: FulfillmentBatchStatus,
    default: FulfillmentBatchStatus.OPEN,
  })
  status: FulfillmentBatchStatus;

  @Column({ name: 'batch_date', type: 'timestamptz' })
  batchDate: Date;

  @Column({ name: 'line_count', type: 'int', default: 0 })
  lineCount: number;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isOpen(): boolean {
    return this.status === FulfillmentBatchStatus.OPEN;
  }

  isLocked(): boolean {
    return this.status === FulfillmentBatchStatus.LOCKED;
  }

  isDispatched(): boolean {
    return this.status === FulfillmentBatchStatus.DISPATCHED;
  }

  isCompleted(): boolean {
    return this.status === FulfillmentBatchStatus.COMPLETED;
  }
}

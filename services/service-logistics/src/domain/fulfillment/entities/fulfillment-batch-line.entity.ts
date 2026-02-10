import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FulfillmentBatchLineStatus {
  TO_PREPARE = 'TO_PREPARE',
  PREPARED = 'PREPARED',
  SHIPPED = 'SHIPPED',
}

@Entity('fulfillment_batch_lines')
export class FulfillmentBatchLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

   @Column({ name: 'organisation_id', type: 'uuid' })
   @Index()
   organisationId: string;

  @Column({ name: 'batch_id', type: 'uuid' })
  @Index()
  batchId: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ name: 'address_snapshot_id', type: 'uuid' })
  addressSnapshotId: string;

  @Column({ name: 'preference_snapshot_id', type: 'uuid' })
  preferenceSnapshotId: string;

  @Column({
    name: 'line_status',
    type: 'enum',
    enum: FulfillmentBatchLineStatus,
    default: FulfillmentBatchLineStatus.TO_PREPARE,
  })
  lineStatus: FulfillmentBatchLineStatus;

  @Column({ name: 'expedition_id', type: 'uuid', nullable: true })
  expeditionId: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isPrepared(): boolean {
    return this.lineStatus === FulfillmentBatchLineStatus.PREPARED;
  }

  isShipped(): boolean {
    return this.lineStatus === FulfillmentBatchLineStatus.SHIPPED;
  }

  hasError(): boolean {
    return this.errorMessage !== null;
  }
}

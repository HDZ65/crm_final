import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WooCommerceEntityType {
  CLIENT = 'CLIENT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
}

@Entity('woocommerce_mappings')
@Index(['organisationId', 'entityType', 'wooId'], { unique: true })
export class WooCommerceMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'entity_type', type: 'enum', enum: WooCommerceEntityType })
  entityType: WooCommerceEntityType;

  @Column({ name: 'woo_id', type: 'varchar', length: 255 })
  wooId: string;

  @Column({ name: 'crm_entity_id', type: 'uuid' })
  crmEntityId: string;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

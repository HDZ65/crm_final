import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('woocommerce_configs')
export class WooCommerceConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid', unique: true })
  @Index()
  organisationId: string;

  @Column({ name: 'store_url', type: 'varchar', length: 500 })
  storeUrl: string;

  @Column({ name: 'webhook_secret', type: 'varchar', length: 255 })
  webhookSecret: string;

  @Column({ name: 'consumer_key_hash', type: 'varchar', length: 255 })
  consumerKeyHash: string;

  @Column({ name: 'consumer_secret_hash', type: 'varchar', length: 255 })
  consumerSecretHash: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

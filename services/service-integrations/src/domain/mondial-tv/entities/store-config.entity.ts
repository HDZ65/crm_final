import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum StoreType {
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
}

@Entity('store_configs')
@Index(['keycloakGroupId', 'storeType'], { unique: true })
@Index(['keycloakGroupId', 'active'])
export class StoreConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId!: string;

  @Column({
    name: 'store_type',
    type: 'enum',
    enum: StoreType,
  })
  storeType!: StoreType;

  @Column({
    name: 'bundle_id',
    type: 'varchar',
    length: 255,
  })
  bundleId!: string;

  @Column({
    name: 'shared_secret_hash',
    type: 'varchar',
    length: 255,
  })
  sharedSecretHash!: string;

  @Column({
    name: 'webhook_url',
    type: 'varchar',
    length: 512,
  })
  webhookUrl!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Business methods
  isActive(): boolean {
    return this.active;
  }

  deactivate(): void {
    this.active = false;
  }

  activate(): void {
    this.active = true;
  }

  isAppleStore(): boolean {
    return this.storeType === StoreType.APPLE;
  }

  isGoogleStore(): boolean {
    return this.storeType === StoreType.GOOGLE;
  }
}

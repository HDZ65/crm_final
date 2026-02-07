import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SourceSystem {
  IMS = 'IMS',
  WEB = 'WEB',
  MOBILE_APP = 'MOBILE_APP',
  TV_APP = 'TV_APP',
  BOX = 'BOX',
}

@Entity('client_external_mappings')
@Index(['organisationId', 'clientId'])
@Index(['organisationId', 'sourceSystem'])
export class ClientExternalMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'source_system',
    type: 'enum',
    enum: SourceSystem,
  })
  sourceSystem: SourceSystem;

  @Column({ name: 'source_channel', type: 'varchar', length: 100, nullable: true })
  sourceChannel: string | null;

  @Column({
    name: 'ims_user_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  imsUserId: string | null;

  @Column({
    name: 'store_customer_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  storeCustomerId: string | null;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

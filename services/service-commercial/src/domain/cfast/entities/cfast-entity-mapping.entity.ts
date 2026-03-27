import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('cfast_entity_mappings')
@Unique(['organisationId', 'crmEntityType', 'crmEntityId', 'cfastEntityType'])
@Index('idx_cfast_mapping_crm', ['organisationId', 'crmEntityType', 'crmEntityId'])
@Index('idx_cfast_mapping_cfast', ['organisationId', 'cfastEntityType', 'cfastEntityId'])
export class CfastEntityMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'crm_entity_type', type: 'varchar', length: 50 })
  crmEntityType: string;

  @Column({ name: 'crm_entity_id', type: 'uuid' })
  crmEntityId: string;

  @Column({ name: 'cfast_entity_type', type: 'varchar', length: 50 })
  cfastEntityType: string;

  @Column({ name: 'cfast_entity_id', type: 'varchar', length: 255 })
  cfastEntityId: string;

  @Column({ name: 'metadata', type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

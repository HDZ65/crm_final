import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('cfast_entity_mappings')
@Unique(['keycloakGroupId', 'crmEntityType', 'crmEntityId', 'cfastEntityType'])
@Index('idx_cfast_mapping_crm', ['keycloakGroupId', 'crmEntityType', 'crmEntityId'])
@Index('idx_cfast_mapping_cfast', ['keycloakGroupId', 'cfastEntityType', 'cfastEntityId'])
export class CfastEntityMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId!: string;

  @Column({ name: 'crm_entity_type', type: 'varchar', length: 50 })
  crmEntityType!: string;

  @Column({ name: 'crm_entity_id', type: 'uuid' })
  crmEntityId!: string;

  @Column({ name: 'cfast_entity_type', type: 'varchar', length: 50 })
  cfastEntityType!: string;

  @Column({ name: 'cfast_entity_id', type: 'varchar', length: 255 })
  cfastEntityId!: string;

  @Column({ name: 'metadata', type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

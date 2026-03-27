import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('winleadplus_mappings')
@Index(['keycloakGroupId', 'winleadplusProspectId'], { unique: true })
export class WinLeadPlusMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  @Index()
  keycloakGroupId!: string;

  @Column({ name: 'winleadplus_prospect_id', type: 'int' })
  winleadplusProspectId!: number;

  @Column({ name: 'crm_client_id', type: 'uuid' })
  @Index()
  crmClientId!: string;

  @Column({ name: 'crm_contrat_ids', type: 'jsonb', default: '[]' })
  crmContratIds!: string[];

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt!: Date | null;

  @Column({ name: 'data_hash', type: 'varchar', length: 64, nullable: true })
  dataHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

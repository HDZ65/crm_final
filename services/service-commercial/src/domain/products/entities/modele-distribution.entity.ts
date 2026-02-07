import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('modeledistributions')
@Index('idx_modele_distribution_organisation_id', ['organisationId'])
@Index('idx_modele_distribution_partenaire_id', ['partenaireCommercialId'])
@Index('idx_modele_distribution_societe_id', ['societeId'])
export class ModeleDistributionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Partner & Distribution Links
  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: true })
  partenaireCommercialId: string | null;

  @Column({ type: 'uuid', nullable: true })
  societeId: string | null;

  // Sales Channel & Revenue Sharing
  @Column({ type: 'varchar', length: 50, nullable: true })
  canalVente: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxPartageRevenu: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxCommissionPartenaire: number | null;

  @Column({ type: 'jsonb', nullable: true })
  reglesPartage: Record<string, any> | null;

  // Activation & Dates
  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ type: 'date', nullable: true })
  dateDebut: Date | null;

  @Column({ type: 'date', nullable: true })
  dateFin: Date | null;

  // Audit Fields
  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

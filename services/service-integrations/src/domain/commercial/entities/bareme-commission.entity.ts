import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PalierCommissionEntity } from './palier-commission.entity';

export enum TypeCalcul {
  FIXE = 'fixe',
  POURCENTAGE = 'pourcentage',
  PALIER = 'palier',
  MIXTE = 'mixte',
}

export enum BaseCalcul {
  COTISATION_HT = 'cotisation_ht',
  CA_HT = 'ca_ht',
  FORFAIT = 'forfait',
}

@Entity('baremes_commission')
@Index(['keycloakGroupId', 'actif'])
@Index(['typeProduit', 'actif'])
export class BaremeCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  @Index()
  keycloakGroupId!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  nom!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'type_calcul', type: 'enum', enum: TypeCalcul })
  typeCalcul!: TypeCalcul;

  @Column({ name: 'base_calcul', type: 'enum', enum: BaseCalcul })
  baseCalcul!: BaseCalcul;

  @Column({ name: 'montant_fixe', type: 'decimal', precision: 10, scale: 2, nullable: true })
  montantFixe!: number | null;

  @Column({ name: 'taux_pourcentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxPourcentage!: number | null;

  @Column({ name: 'type_produit', type: 'varchar', length: 100, nullable: true })
  typeProduit!: string | null;

  @Column({ name: 'canal_vente', type: 'varchar', length: 50, nullable: true })
  canalVente!: string | null;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'date_effet', type: 'date' })
  dateEffet!: Date;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin!: Date | null;

  @Column({ type: 'boolean', default: true })
  actif!: boolean;

  @OneToMany(() => PalierCommissionEntity, (palier) => palier.bareme)
  paliers!: PalierCommissionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

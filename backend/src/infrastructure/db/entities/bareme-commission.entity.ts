import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PalierCommissionEntity } from './palier-commission.entity';

@Entity('baremes_commission')
export class BaremeCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Type de calcul
  @Column({
    name: 'type_calcul',
    type: 'varchar',
    length: 20,
    default: 'fixe',
  })
  typeCalcul: string; // 'fixe' | 'pourcentage' | 'palier' | 'mixte'

  @Column({
    name: 'base_calcul',
    type: 'varchar',
    length: 20,
    default: 'forfait',
  })
  baseCalcul: string; // 'cotisation_ht' | 'ca_ht' | 'forfait'

  // Valeurs de calcul
  @Column({
    name: 'montant_fixe',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  montantFixe: number | null;

  @Column({
    name: 'taux_pourcentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  tauxPourcentage: number | null;

  // Récurrence
  @Column({ name: 'recurrence_active', type: 'boolean', default: false })
  recurrenceActive: boolean;

  @Column({
    name: 'taux_recurrence',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  tauxRecurrence: number | null;

  @Column({ name: 'duree_recurrence_mois', type: 'int', nullable: true })
  dureeRecurrenceMois: number | null;

  // Reprises
  @Column({ name: 'duree_reprises_mois', type: 'int', default: 3 })
  dureeReprisesMois: number;

  @Column({
    name: 'taux_reprise',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  tauxReprise: number;

  // Filtres d'application
  @Column({ name: 'type_produit', type: 'varchar', length: 50, nullable: true })
  typeProduit: string | null;

  @Column({
    name: 'profil_remuneration',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  profilRemuneration: string | null;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string | null;

  // Versioning
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'date_effet', type: 'date' })
  dateEffet: Date;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin: Date | null;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  // Audit
  @Column({ name: 'cree_par', type: 'varchar', nullable: true })
  creePar: string | null;

  @Column({ name: 'modifie_par', type: 'varchar', nullable: true })
  modifiePar: string | null;

  @Column({ name: 'motif_modification', type: 'text', nullable: true })
  motifModification: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => PalierCommissionEntity, (palier) => palier.bareme)
  paliers: PalierCommissionEntity[];
}

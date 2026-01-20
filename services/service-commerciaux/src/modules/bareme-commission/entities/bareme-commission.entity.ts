import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PalierCommission } from '../../palier-commission/entities/palier-commission.entity';

@Entity('baremes_commission')
export class BaremeCommission {
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

  @Column({ name: 'type_calcul', type: 'varchar', length: 20, default: 'fixe' })
  typeCalcul: string;

  @Column({ name: 'base_calcul', type: 'varchar', length: 20, default: 'forfait' })
  baseCalcul: string;

  @Column({ name: 'montant_fixe', type: 'decimal', precision: 10, scale: 2, nullable: true })
  montantFixe: number | null;

  @Column({ name: 'taux_pourcentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxPourcentage: number | null;

  @Column({ name: 'precomptee', type: 'boolean', default: false })
  precomptee: boolean;

  @Column({ name: 'recurrence_active', type: 'boolean', default: false })
  recurrenceActive: boolean;

  @Column({ name: 'taux_recurrence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxRecurrence: number | null;

  @Column({ name: 'duree_recurrence_mois', type: 'int', nullable: true })
  dureeRecurrenceMois: number | null;

  @Column({ name: 'duree_reprises_mois', type: 'int', default: 3 })
  dureeReprisesMois: number;

  @Column({ name: 'taux_reprise', type: 'decimal', precision: 5, scale: 2, default: 100 })
  tauxReprise: number;

  @Column({ name: 'type_produit', type: 'varchar', length: 50, nullable: true })
  typeProduit: string | null;

  @Column({ name: 'profil_remuneration', type: 'varchar', length: 50, nullable: true })
  profilRemuneration: string | null;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string | null;

  @Column({ name: 'canal_vente', type: 'varchar', length: 20, nullable: true })
  canalVente: string | null;

  @Column({ name: 'repartition_commercial', type: 'decimal', precision: 5, scale: 2, default: 100 })
  repartitionCommercial: number;

  @Column({ name: 'repartition_manager', type: 'decimal', precision: 5, scale: 2, default: 0 })
  repartitionManager: number;

  @Column({ name: 'repartition_agence', type: 'decimal', precision: 5, scale: 2, default: 0 })
  repartitionAgence: number;

  @Column({ name: 'repartition_entreprise', type: 'decimal', precision: 5, scale: 2, default: 0 })
  repartitionEntreprise: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'date_effet', type: 'date' })
  dateEffet: Date;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin: Date | null;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

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

  @OneToMany(() => PalierCommission, (palier) => palier.bareme)
  paliers: PalierCommission[];
}

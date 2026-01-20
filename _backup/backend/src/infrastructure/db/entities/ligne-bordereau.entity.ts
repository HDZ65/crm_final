import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BordereauCommissionEntity } from './bordereau-commission.entity';

@Entity('lignes_bordereau')
export class LigneBordereauEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'bordereau_id', type: 'uuid' })
  bordereauId: string;

  @Column({ name: 'commission_id', type: 'uuid', nullable: true })
  commissionId: string | null;

  @Column({ name: 'reprise_id', type: 'uuid', nullable: true })
  repriseId: string | null;

  @Column({
    name: 'type_ligne',
    type: 'varchar',
    length: 20,
    default: 'commission',
  })
  typeLigne: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'contrat_reference', length: 100 })
  contratReference: string;

  @Column({ name: 'client_nom', type: 'varchar', nullable: true })
  clientNom: string | null;

  @Column({ name: 'produit_nom', type: 'varchar', nullable: true })
  produitNom: string | null;

  @Column({
    name: 'montant_brut',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  montantBrut: number;

  @Column({
    name: 'montant_reprise',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  montantReprise: number;

  @Column({
    name: 'montant_net',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  montantNet: number;

  @Column({ name: 'base_calcul', type: 'varchar', length: 20, nullable: true })
  baseCalcul: string | null;

  @Column({
    name: 'taux_applique',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  tauxApplique: number | null;

  @Column({ name: 'bareme_id', type: 'uuid', nullable: true })
  baremeId: string | null;

  @Column({
    name: 'statut_ligne',
    type: 'varchar',
    length: 20,
    default: 'selectionnee',
  })
  statutLigne: string;

  @Column({ type: 'boolean', default: true })
  selectionne: boolean;

  @Column({ name: 'motif_deselection', type: 'text', nullable: true })
  motifDeselection: string | null;

  @Column({ name: 'validateur_id', type: 'varchar', nullable: true })
  validateurId: string | null;

  @Column({ name: 'date_validation', type: 'timestamp', nullable: true })
  dateValidation: Date | null;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => BordereauCommissionEntity, (bordereau) => bordereau.lignes)
  @JoinColumn({ name: 'bordereau_id' })
  bordereau: BordereauCommissionEntity;
}

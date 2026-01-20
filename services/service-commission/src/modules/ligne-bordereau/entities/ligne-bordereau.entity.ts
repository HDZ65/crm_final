import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BordereauCommissionEntity } from '../../bordereau/entities/bordereau-commission.entity';

export enum TypeLigne {
  COMMISSION = 'commission',
  REPRISE = 'reprise',
  ACOMPTE = 'acompte',
  PRIME = 'prime',
  REGULARISATION = 'regularisation',
}

export enum StatutLigne {
  SELECTIONNEE = 'selectionnee',
  DESELECTIONNEE = 'deselectionnee',
  VALIDEE = 'validee',
  REJETEE = 'rejetee',
}

@Entity('lignes_bordereau')
@Index(['bordereauId', 'ordre'])
export class LigneBordereauEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'bordereau_id', type: 'uuid' })
  bordereauId: string;

  @ManyToOne(() => BordereauCommissionEntity, (bordereau) => bordereau.lignes)
  @JoinColumn({ name: 'bordereau_id' })
  bordereau: BordereauCommissionEntity;

  @Column({ name: 'commission_id', type: 'uuid', nullable: true })
  commissionId: string | null;

  @Column({ name: 'reprise_id', type: 'uuid', nullable: true })
  repriseId: string | null;

  @Column({ name: 'type_ligne', type: 'enum', enum: TypeLigne })
  typeLigne: TypeLigne;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'contrat_reference', type: 'varchar', length: 100 })
  contratReference: string;

  @Column({ name: 'client_nom', type: 'varchar', length: 255, nullable: true })
  clientNom: string | null;

  @Column({ name: 'produit_nom', type: 'varchar', length: 255, nullable: true })
  produitNom: string | null;

  @Column({ name: 'montant_brut', type: 'decimal', precision: 10, scale: 2 })
  montantBrut: number;

  @Column({ name: 'montant_reprise', type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantReprise: number;

  @Column({ name: 'montant_net', type: 'decimal', precision: 10, scale: 2 })
  montantNet: number;

  @Column({ name: 'base_calcul', type: 'varchar', length: 50, nullable: true })
  baseCalcul: string | null;

  @Column({ name: 'taux_applique', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxApplique: number | null;

  @Column({ name: 'bareme_id', type: 'uuid', nullable: true })
  baremeId: string | null;

  @Column({
    name: 'statut_ligne',
    type: 'enum',
    enum: StatutLigne,
    default: StatutLigne.SELECTIONNEE,
  })
  statutLigne: StatutLigne;

  @Column({ type: 'boolean', default: true })
  selectionne: boolean;

  @Column({ name: 'motif_deselection', type: 'text', nullable: true })
  motifDeselection: string | null;

  @Column({ name: 'validateur_id', type: 'varchar', length: 255, nullable: true })
  validateurId: string | null;

  @Column({ name: 'date_validation', type: 'date', nullable: true })
  dateValidation: Date | null;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

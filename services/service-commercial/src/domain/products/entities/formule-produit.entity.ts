import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ProduitEntity } from './produit.entity';
import { FranchiseType } from '../enums/franchise-type.enum';
import { TypeAjustementPrix } from '../enums/type-ajustement-prix.enum';

export interface GarantieFormule {
  nom: string;
  description: string | null;
  plafond: number | null;
  franchise: number | null;
  actif: boolean;
}

export interface OptionFormule {
  nom: string;
  prix_supplement: number | null;
  description: string | null;
  obligatoire: boolean;
}

@Entity('produit_formules')
@Unique(['produitId', 'code'])
@Index(['produitId'])
export class FormuleProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Column({ type: 'jsonb', nullable: true })
  garanties: GarantieFormule[] | null;

  @Column({ type: 'jsonb', nullable: true })
  options: OptionFormule[] | null;

  @Column({ name: 'franchise_montant', type: 'decimal', precision: 12, scale: 2, nullable: true })
  franchiseMontant: number | null;

  @Column({
    name: 'franchise_type',
    type: 'enum',
    enum: FranchiseType,
    nullable: true,
  })
  franchiseType: FranchiseType | null;

  @Column({ name: 'prix_formule', type: 'decimal', precision: 12, scale: 2, nullable: true })
  prixFormule: number | null;

  @Column({
    name: 'type_ajustement_prix',
    type: 'enum',
    enum: TypeAjustementPrix,
    nullable: true,
  })
  typeAjustementPrix: TypeAjustementPrix | null;

  @Column({ default: true })
  actif: boolean;

  @Column({ name: 'version_produit_id', type: 'uuid', nullable: true })
  versionProduitId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ProduitEntity, (produit) => produit.formules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produit_id' })
  produit: ProduitEntity;
}

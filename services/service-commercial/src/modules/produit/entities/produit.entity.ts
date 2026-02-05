import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { GammeEntity } from '../../gamme/entities/gamme.entity';
import { PrixProduitEntity } from '../../prix-produit/entities/prix-produit.entity';
import { VersionProduitEntity } from '../../version-produit/entities/version-produit.entity';

export enum TypeProduit {
  INTERNE = 'INTERNE',
  PARTENAIRE = 'PARTENAIRE',
}

export enum CategorieProduit {
  ASSURANCE = 'ASSURANCE',
  PREVOYANCE = 'PREVOYANCE',
  EPARGNE = 'EPARGNE',
  SERVICE = 'SERVICE',
  ACCESSOIRE = 'ACCESSOIRE',
}

export enum StatutCycleProduit {
  BROUILLON = 'BROUILLON',
  TEST = 'TEST',
  ACTIF = 'ACTIF',
  GELE = 'GELE',
  RETIRE = 'RETIRE',
}

@Entity('produit')
@Index(['organisationId', 'sku'], { unique: true })
export class ProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'gamme_id', type: 'uuid', nullable: true })
  gammeId: string | null;

  @Column({ length: 50 })
  sku: string;

  @Column({ length: 200 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: CategorieProduit,
    default: CategorieProduit.SERVICE,
  })
  categorie: CategorieProduit;

  @Column({
    type: 'enum',
    enum: TypeProduit,
    default: TypeProduit.INTERNE,
  })
  type: TypeProduit;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  prix: number;

  @Column({ name: 'taux_tva', type: 'decimal', precision: 5, scale: 2, default: 20 })
  tauxTva: number;

  @Column({ length: 3, default: 'EUR' })
  devise: string;

  @Column({ default: true })
  actif: boolean;

  @Column({
    name: 'statut_cycle',
    type: 'enum',
    enum: StatutCycleProduit,
    default: StatutCycleProduit.ACTIF,
  })
  statutCycle: StatutCycleProduit;

  @Column({ name: 'promotion_active', default: false })
  promotionActive: boolean;

  @Column({ name: 'prix_promotion', type: 'decimal', precision: 12, scale: 2, nullable: true })
  prixPromotion: number | null;

  @Column({ name: 'date_debut_promotion', type: 'timestamp', nullable: true })
  dateDebutPromotion: Date | null;

  @Column({ name: 'date_fin_promotion', type: 'timestamp', nullable: true })
  dateFinPromotion: Date | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'code_externe', type: 'varchar', length: 100, nullable: true })
  codeExterne: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => GammeEntity, (gamme) => gamme.produits, { nullable: true })
  @JoinColumn({ name: 'gamme_id' })
  gamme: GammeEntity | null;

  @OneToMany(() => PrixProduitEntity, (prix) => prix.produit)
  prixProduits: PrixProduitEntity[];

  @OneToMany(() => VersionProduitEntity, (version) => version.produit)
  versions: VersionProduitEntity[];
}

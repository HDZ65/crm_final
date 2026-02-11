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
import { GammeEntity } from './gamme.entity';
import { ModeleDistributionEntity } from './modele-distribution.entity';
import { PrixProduitEntity } from './prix-produit.entity';
import { VersionProduitEntity } from './version-produit.entity';
import { PartenaireCommercialEntity } from '../../commercial/entities/partenaire-commercial.entity';
import { TypeTarification } from '../enums/type-tarification.enum';
import { FormuleProduitEntity } from './formule-produit.entity';

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

  // --- Contractual terms ---

  @Column({ name: 'duree_engagement_mois', type: 'int', nullable: true })
  dureeEngagementMois: number | null;

  @Column({ name: 'frequence_renouvellement', type: 'varchar', length: 50, nullable: true })
  frequenceRenouvellement: string | null;

  @Column({ name: 'conditions_resiliation', type: 'text', nullable: true })
  conditionsResiliation: string | null;

  @Column({ name: 'unite_vente', type: 'varchar', length: 50, default: 'UNITE' })
  uniteVente: string;

  // --- Accounting mapping ---

  @Column({ name: 'code_comptable', type: 'varchar', length: 20, nullable: true })
  codeComptable: string | null;

  @Column({ name: 'compte_produit', type: 'varchar', length: 20, nullable: true })
  compteProduit: string | null;

  @Column({ name: 'journal_vente', type: 'varchar', length: 20, nullable: true })
  journalVente: string | null;

  // --- Partner & distribution FK ---

  @Column({ name: 'partenaire_commercial_id', type: 'uuid', nullable: true })
  @Index()
  partenaireCommercialId: string | null;

  @Column({ name: 'modele_distribution_id', type: 'uuid', nullable: true })
  @Index()
  modeleDistributionId: string | null;

  // --- Tarification model ---

  @Column({
    name: 'type_tarification',
    type: 'enum',
    enum: TypeTarification,
    default: TypeTarification.FIXE,
  })
  typeTarification: TypeTarification;

  @Column({ name: 'config_tarification', type: 'jsonb', nullable: true })
  configTarification: Record<string, unknown> | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown> | null;

    // --- Partner catalogue synchronization ---

    @Column({ type: 'boolean', default: false })
    popular: boolean;

    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    rating: number | null;

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl: string | null;

    @Column({ name: 'features_data', type: 'jsonb', nullable: true })
    featuresData: Record<string, unknown> | null;

    @Column({ name: 'formules_data', type: 'jsonb', nullable: true })
    formulesData: Record<string, unknown> | null;

    @Column({ name: 'categorie_partenaire', type: 'varchar', length: 100, nullable: true })
    categoriePartenaire: string | null;

    @Column({ name: 'source_derniere_modif', type: 'varchar', length: 50, nullable: true })
    sourceDerniereModif: string | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    fournisseur: string | null;

    @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
    createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => GammeEntity, (gamme) => gamme.produits, { nullable: true })
  @JoinColumn({ name: 'gamme_id' })
  gamme: GammeEntity | null;

  @ManyToOne(() => PartenaireCommercialEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'partenaire_commercial_id' })
  partenaireCommercial: PartenaireCommercialEntity | null;

  @ManyToOne(() => ModeleDistributionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'modele_distribution_id' })
  modeleDistribution: ModeleDistributionEntity | null;

  @OneToMany(() => PrixProduitEntity, (prix) => prix.produit)
  prixProduits: PrixProduitEntity[];

  @OneToMany(() => VersionProduitEntity, (version) => version.produit)
  versions: VersionProduitEntity[];

  @OneToMany(() => FormuleProduitEntity, (formule) => formule.produit)
  formules: FormuleProduitEntity[];
}

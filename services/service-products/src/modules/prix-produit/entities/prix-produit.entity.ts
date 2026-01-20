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
import { ProduitEntity } from '../../produit/entities/produit.entity';
import { GrilleTarifaireEntity } from '../../grille-tarifaire/entities/grille-tarifaire.entity';

@Entity('prix_produit')
@Unique(['grilleTarifaireId', 'produitId'])
@Index(['grilleTarifaireId'])
@Index(['produitId'])
export class PrixProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'grille_tarifaire_id', type: 'uuid' })
  grilleTarifaireId: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ name: 'prix_unitaire', type: 'decimal', precision: 12, scale: 2 })
  prixUnitaire: number;

  @Column({ name: 'remise_pourcent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  remisePourcent: number;

  @Column({ name: 'prix_minimum', type: 'decimal', precision: 12, scale: 2, nullable: true })
  prixMinimum: number | null;

  @Column({ name: 'prix_maximum', type: 'decimal', precision: 12, scale: 2, nullable: true })
  prixMaximum: number | null;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ProduitEntity, (produit) => produit.prixProduits)
  @JoinColumn({ name: 'produit_id' })
  produit: ProduitEntity;

  @ManyToOne(() => GrilleTarifaireEntity, (grille) => grille.prixProduits)
  @JoinColumn({ name: 'grille_tarifaire_id' })
  grilleTarifaire: GrilleTarifaireEntity;
}

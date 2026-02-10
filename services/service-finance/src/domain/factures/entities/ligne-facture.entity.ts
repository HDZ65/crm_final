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
import type { FactureEntity } from './facture.entity';

@Entity('ligne_facture')
@Index(['factureId'])
export class LigneFactureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  factureId: string;

  @Column({ type: 'uuid' })
  produitId: string;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prixUnitaire: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montantHT: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  tauxTVA: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montantTVA: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montantTTC: number;

  @Column({ type: 'int', default: 0 })
  ordreAffichage: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('FactureEntity', (facture: FactureEntity) => facture.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facture_id' })
  facture: FactureEntity;

  // Business logic
  static calculateAmounts(
    quantite: number,
    prixUnitaire: number,
    tauxTVA: number,
  ): { montantHT: number; montantTVA: number; montantTTC: number } {
    const montantHT = Math.round(quantite * prixUnitaire * 100) / 100;
    const montantTVA = Math.round(montantHT * (tauxTVA / 100) * 100) / 100;
    const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;
    return { montantHT, montantTVA, montantTTC };
  }
}

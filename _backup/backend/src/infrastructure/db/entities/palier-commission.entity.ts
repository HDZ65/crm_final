import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaremeCommissionEntity } from './bareme-commission.entity';

@Entity('paliers_commission')
export class PalierCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'bareme_id', type: 'uuid' })
  baremeId: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 255 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'type_palier',
    type: 'varchar',
    length: 20,
    default: 'volume',
  })
  typePalier: string; // 'volume' | 'ca' | 'prime_produit'

  // Seuils
  @Column({ name: 'seuil_min', type: 'decimal', precision: 12, scale: 2 })
  seuilMin: number;

  @Column({
    name: 'seuil_max',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  seuilMax: number | null;

  // Récompense
  @Column({
    name: 'montant_prime',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  montantPrime: number;

  @Column({
    name: 'taux_bonus',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  tauxBonus: number | null;

  // Configuration
  @Column({ type: 'boolean', default: true })
  cumulable: boolean;

  @Column({ name: 'par_periode', type: 'boolean', default: true })
  parPeriode: boolean;

  @Column({ name: 'type_produit', type: 'varchar', length: 50, nullable: true })
  typeProduit: string | null;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => BaremeCommissionEntity, (bareme) => bareme.paliers)
  @JoinColumn({ name: 'bareme_id' })
  bareme: BaremeCommissionEntity;
}

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
import { BaremeCommissionEntity } from './bareme-commission.entity';

export enum TypePalier {
  VOLUME = 'volume',
  CA = 'ca',
  PRIME_PRODUIT = 'prime_produit',
}

@Entity('paliers_commission')
@Index(['baremeId', 'ordre'])
export class PalierCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'bareme_id', type: 'uuid' })
  baremeId: string;

  @ManyToOne(() => BaremeCommissionEntity, (bareme) => bareme.paliers)
  @JoinColumn({ name: 'bareme_id' })
  bareme: BaremeCommissionEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'type_palier', type: 'enum', enum: TypePalier })
  typePalier: TypePalier;

  @Column({ name: 'seuil_min', type: 'decimal', precision: 12, scale: 2 })
  seuilMin: number;

  @Column({ name: 'seuil_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
  seuilMax: number | null;

  @Column({ name: 'montant_prime', type: 'decimal', precision: 10, scale: 2 })
  montantPrime: number;

  @Column({ name: 'taux_bonus', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxBonus: number | null;

  @Column({ type: 'boolean', default: false })
  cumulable: boolean;

  @Column({ name: 'par_periode', type: 'boolean', default: true })
  parPeriode: boolean;

  @Column({ name: 'type_produit', type: 'varchar', length: 100, nullable: true })
  typeProduit: string | null;

  @Column({ type: 'int', default: 0 })
  ordre: number;

   @Column({ type: 'boolean', default: true })
   actif: boolean;

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

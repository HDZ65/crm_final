import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaremeCommissionEntity } from './bareme-commission.entity';

@Entity('paliers_commission')
export class PalierCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bareme_id', type: 'uuid' })
  baremeId!: string;

  @Column({ name: 'seuil_min', type: 'decimal', precision: 15, scale: 2 })
  seuilMin!: number;

  @Column({ name: 'seuil_max', type: 'decimal', precision: 15, scale: 2, nullable: true })
  seuilMax!: number | null;

  @Column({ name: 'montant_prime', type: 'decimal', precision: 10, scale: 2 })
  montantPrime!: number;

  @Column({ type: 'boolean', default: false })
  cumulable!: boolean;

  @Column({ type: 'int', default: 1 })
  ordre!: number;

  @ManyToOne(() => BaremeCommissionEntity, (bareme) => bareme.paliers)
  @JoinColumn({ name: 'bareme_id' })
  bareme!: Relation<BaremeCommissionEntity>;
}

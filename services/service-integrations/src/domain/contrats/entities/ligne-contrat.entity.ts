import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ContratEntity } from './contrat.entity';

@Entity('ligne_contrat')
export class LigneContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId!: string;

  @Column({ name: 'produit_id', type: 'uuid', nullable: true })
  produitId!: string | null;

  @Column({ name: 'periode_facturation_id', type: 'uuid', nullable: true })
  periodeFacturationId!: string | null;

  @Column({ type: 'int', default: 1 })
  quantite!: number;

  @Column({ name: 'prix_unitaire', type: 'decimal', precision: 15, scale: 2, default: 0 })
  prixUnitaire!: number;

  @Column({ name: 'canal_vente', type: 'text', nullable: true })
  canalVente!: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy!: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ContratEntity, (contrat) => contrat.lignes)
  @JoinColumn({ name: 'contrat_id' })
  contrat!: Relation<ContratEntity>;
}

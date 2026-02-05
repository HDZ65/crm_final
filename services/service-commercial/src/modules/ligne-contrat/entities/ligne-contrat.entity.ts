import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContratEntity } from '../../contrat/entities/contrat.entity';

@Entity('ligne_contrat')
export class LigneContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contrat_id', type: 'uuid' })
  contratId: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ name: 'periode_facturation_id', type: 'uuid' })
  periodeFacturationId: string;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ name: 'prix_unitaire', type: 'decimal', precision: 15, scale: 2 })
  prixUnitaire: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ContratEntity, (contrat) => contrat.lignes)
  @JoinColumn({ name: 'contrat_id' })
  contrat: ContratEntity;
}

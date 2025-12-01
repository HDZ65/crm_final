import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContratEntity } from './contrat.entity';

@Entity('lignecontrats')
export class LigneContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantite: number;

  @Column()
  prixUnitaire: number;

  @Column()
  contratId: string;

  @ManyToOne(() => ContratEntity, (contrat) => contrat.lignesContrat)
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity;

  @Column()
  periodeFacturationId: string;

  @Column()
  produitId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PeriodeFacturationEntity } from './periode-facturation.entity';

@Entity('prixproduits')
export class PrixProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  prix: number;

  @Column()
  periodeFacturationId: string;

  @ManyToOne(() => PeriodeFacturationEntity, (periode) => periode.prixProduits)
  @JoinColumn({ name: 'periodeFacturationId' })
  periodeFacturation: PeriodeFacturationEntity;

  @Column()
  remisePourcent: number;

  @Column()
  produitId: string;

  @Column()
  grilleTarifaireId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

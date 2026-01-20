import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PrixProduitEntity } from './prix-produit.entity';

@Entity('periodefacturations')
export class PeriodeFacturationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  nom: string;

  @Column()
  description: string;

  @OneToMany(
    () => PrixProduitEntity,
    (prixProduit) => prixProduit.periodeFacturation,
  )
  prixProduits: PrixProduitEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SocieteEntity } from './societe.entity';
import { ProduitEntity } from './produit.entity';

@Entity('gammes')
export class GammeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  societeId: string;

  @ManyToOne(() => SocieteEntity)
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column()
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  icone: string;

  @Column({ default: true })
  actif: boolean;

  @OneToMany(() => ProduitEntity, (produit) => produit.gamme)
  produits: ProduitEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SocieteEntity } from './societe.entity';
import { GammeEntity } from './gamme.entity';

@Entity('produits')
export class ProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  societeId: string;

  @ManyToOne(() => SocieteEntity)
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  @Column({ nullable: true })
  gammeId: string;

  @ManyToOne(() => GammeEntity, (gamme) => gamme.produits)
  @JoinColumn({ name: 'gammeId' })
  gamme: GammeEntity;

  @Column()
  sku: string;

  @Column()
  nom: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  categorie: string;

  @Column({ type: 'varchar', default: 'Interne' })
  type: 'Interne' | 'Partenaire';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  prix: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  tauxTVA: number;

  @Column({ default: 'EUR' })
  devise: string;

  @Column({ nullable: true })
  fournisseur: string;

  @Column({ default: true })
  actif: boolean;

  // Champs promotion
  @Column({ default: false })
  promotionActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  promotionPourcentage: number;

  @Column({ type: 'varchar', nullable: true })
  promotionDateDebut: string;

  @Column({ type: 'varchar', nullable: true })
  promotionDateFin: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

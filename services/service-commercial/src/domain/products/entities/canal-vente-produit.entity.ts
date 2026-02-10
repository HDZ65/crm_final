import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ProduitEntity } from './produit.entity';
import { CanalVente } from '../enums/canal-vente.enum';

@Entity('canal_vente_produit')
@Index(['produitId', 'canal'])
@Unique(['produitId', 'canal'])
export class CanalVenteProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({
    type: 'enum',
    enum: CanalVente,
  })
  canal: CanalVente;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produit_id' })
  produit: ProduitEntity;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProduitEntity } from './produit.entity';

@Entity('produit_versions')
@Index(['produitId', 'version'], { unique: true })
export class VersionProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ name: 'effective_from', type: 'timestamp' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  effectiveTo: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

   @Column({ name: 'breaking_changes', default: false })
   breakingChanges: boolean;

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ProduitEntity, (produit) => produit.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produit_id' })
  produit: ProduitEntity;
}

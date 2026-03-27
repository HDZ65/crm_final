import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ProduitEntity } from './produit.entity';

@Entity('product_external_mappings')
@Unique(['productId', 'system'])
@Index(['productId'])
@Index(['system', 'externalCode'])
export class ProductExternalMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 100 })
  system: string;

  @Column({ name: 'external_code', type: 'varchar', length: 255 })
  externalCode: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => ProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  produit: ProduitEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

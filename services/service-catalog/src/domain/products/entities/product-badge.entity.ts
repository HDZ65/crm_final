import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProduitEntity } from './produit.entity';

export type BadgeType = 'new' | 'promo' | 'beta' | 'on_quote' | 'expiring_docs';

export const BadgeTypeValues: BadgeType[] = ['new', 'promo', 'beta', 'on_quote', 'expiring_docs'];

@Entity('product_badge')
@Unique(['productId', 'badgeType'])
export class ProductBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  @Index()
  productId: string;

  @Column({
    name: 'badge_type',
    type: 'enum',
    enum: ['new', 'promo', 'beta', 'on_quote', 'expiring_docs'],
    enumName: 'badge_type_enum',
  })
  @Index()
  badgeType: BadgeType;

  @Column({ name: 'is_automatic', type: 'boolean', default: false })
  isAutomatic: boolean;

  @Column({ name: 'start_at', type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(
    () => ProduitEntity,
    (produit) => produit.badges,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'product_id' })
  produit: ProduitEntity;
}

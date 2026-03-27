import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingRuleType } from '../enums/pricing-rule-type.enum';
import { FormuleProduitEntity } from './formule-produit.entity';
import { VersionProduitEntity } from './version-produit.entity';

@Entity('pricing_rules')
@Index(['productVersionId'])
@Index(['planId'])
export class PricingRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_version_id', type: 'uuid' })
  productVersionId: string;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId: string | null;

  @Column({ type: 'enum', enum: PricingRuleType, default: PricingRuleType.FIXED })
  type: PricingRuleType;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, unknown>;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 20.0 })
  taxRate: number;

  @Column({ name: 'tax_included', type: 'boolean', default: false })
  taxIncluded: boolean;

  @ManyToOne(() => VersionProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_version_id' })
  productVersion: VersionProduitEntity;

  @ManyToOne(() => FormuleProduitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan: FormuleProduitEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

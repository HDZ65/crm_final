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
import { AccountingNature } from '../enums/accounting-nature.enum';
import { VersionProduitEntity } from './version-produit.entity';

@Entity('product_accounting_mappings')
@Index(['productVersionId'])
@Index(['companyId'])
@Index(['productVersionId', 'companyId', 'nature'], { unique: true })
export class ProductAccountingMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_version_id', type: 'uuid' })
  productVersionId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'enum', enum: AccountingNature })
  nature: AccountingNature;

  @Column({ name: 'gl_account', type: 'varchar', length: 20 })
  glAccount: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  journal: string | null;

  @Column({ name: 'tax_code', type: 'varchar', length: 20, nullable: true })
  taxCode: string | null;

  @Column({ name: 'cost_center', type: 'varchar', length: 50, nullable: true })
  costCenter: string | null;

  @ManyToOne(() => VersionProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_version_id' })
  productVersion: VersionProduitEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentProduitEntity } from './document-produit.entity';
import { ProduitEntity } from './produit.entity';

export enum DocumentAlertType {
  EXPIRED = 'expired',
  EXPIRING_SOON = 'expiring_soon',
  MISSING = 'missing',
}

export enum DocumentAlertSeverity {
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('document_alert')
@Index(['productId'])
@Index(['alertType'])
@Index(['acknowledged'])
export class DocumentAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'product_document_id', type: 'uuid', nullable: true })
  productDocumentId: string | null;

  @Column({
    name: 'alert_type',
    type: 'varchar',
    length: 20,
  })
  alertType: DocumentAlertType;

  @Column({
    type: 'varchar',
    length: 20,
  })
  severity: DocumentAlertSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string | null;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProduitEntity;

  @ManyToOne(() => DocumentProduitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_document_id' })
  productDocument: DocumentProduitEntity | null;
}

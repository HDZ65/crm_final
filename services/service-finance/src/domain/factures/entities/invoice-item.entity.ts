import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

/**
 * Ligne de facture (Article/Service facture)
 * Conforme aux mentions obligatoires francaises
 */
@Entity('invoice_items')
export class InvoiceItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;

  @Column({ type: 'uuid' })
  invoiceId: string;

  /**
   * Numero d'ordre de la ligne dans la facture
   */
  @Column({ type: 'int' })
  lineNumber: number;

  /**
   * Denomination precise du produit ou service (OBLIGATOIRE)
   */
  @Column({ type: 'varchar', length: 500 })
  description: string;

  /**
   * Quantite (OBLIGATOIRE)
   */
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  /**
   * Unite de mesure (ex: "piece", "heure", "kg", "m2")
   */
  @Column({ type: 'varchar', length: 50, default: 'piece' })
  unit: string;

  /**
   * Prix unitaire Hors Taxes (OBLIGATOIRE)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPriceHT: number;

  /**
   * Taux de TVA applicable en pourcentage (OBLIGATOIRE)
   * Valeurs standards en France: 20, 10, 5.5, 2.1, 0
   */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  vatRate: number;

  /**
   * Montant de la remise (si applicable)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  /**
   * Montant total HT de la ligne (calcule)
   * = (quantity * unitPriceHT) - discount
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalHT: number;

  /**
   * Montant TVA de la ligne (calcule)
   * = totalHT * (vatRate / 100)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTVA: number;

  /**
   * Montant total TTC de la ligne (calcule)
   * = totalHT + totalTVA
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTTC: number;
}

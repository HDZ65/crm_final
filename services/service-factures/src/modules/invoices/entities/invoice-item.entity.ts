import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

/**
 * Ligne de facture (Article/Service facturé)
 * Conforme aux mentions obligatoires françaises
 */
@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'uuid' })
  invoiceId: string;

  /**
   * Numéro d'ordre de la ligne dans la facture
   */
  @Column({ type: 'int' })
  lineNumber: number;

  /**
   * Dénomination précise du produit ou service (OBLIGATOIRE)
   */
  @Column({ type: 'varchar', length: 500 })
  description: string;

  /**
   * Quantité (OBLIGATOIRE)
   */
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  /**
   * Unité de mesure (ex: "pièce", "heure", "kg", "m²")
   */
  @Column({ type: 'varchar', length: 50, default: 'pièce' })
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
   * Montant total HT de la ligne (calculé)
   * = (quantity * unitPriceHT) - discount
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalHT: number;

  /**
   * Montant TVA de la ligne (calculé)
   * = totalHT * (vatRate / 100)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTVA: number;

  /**
   * Montant total TTC de la ligne (calculé)
   * = totalHT + totalTVA
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTTC: number;
}

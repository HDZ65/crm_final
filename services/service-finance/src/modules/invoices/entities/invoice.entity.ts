import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';
import { InvoiceStatus } from './invoice-status.enum';

/**
 * Entité Invoice - Facture conforme à la réglementation française
 *
 * Conformité :
 * - Numérotation séquentielle obligatoire (invoiceNumber)
 * - Mentions légales obligatoires
 * - Impossibilité de modification une fois validée
 * - Support Factur-X (PDF/A-3 + XML embarqué)
 */
@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['status'])
@Index(['issueDate'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Numéro de facture unique et séquentiel
   * Format: {PREFIX}{YEAR}{SEQUENCE}
   * Exemple: INV2025001, INV2025002, etc.
   * OBLIGATOIRE selon CGI Article 242 nonies A
   */
  @Column({ unique: true, length: 50 })
  invoiceNumber: string;

  /**
   * Statut de la facture
   * CRITICAL: Une fois VALIDATED, la facture devient IMMUTABLE
   */
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  // ========== INFORMATIONS CLIENT (OBLIGATOIRES) ==========

  @Column({ length: 255 })
  customerName: string;

  @Column({ type: 'text' })
  customerAddress: string;

  @Column({ length: 100, nullable: true })
  customerSiret?: string;

  @Column({ length: 100, nullable: true })
  customerTvaNumber?: string;

  @Column({ length: 255, nullable: true })
  customerEmail?: string;

  @Column({ length: 50, nullable: true })
  customerPhone?: string;

  // ========== DATES (OBLIGATOIRES) ==========

  /**
   * Date d'émission de la facture (OBLIGATOIRE)
   */
  @Column({ type: 'date' })
  issueDate: Date;

  /**
   * Date de livraison ou fin de prestation (OBLIGATOIRE)
   */
  @Column({ type: 'date' })
  deliveryDate: Date;

  /**
   * Date d'échéance de paiement
   */
  @Column({ type: 'date' })
  dueDate: Date;

  // ========== MONTANTS (OBLIGATOIRES) ==========

  /**
   * Montant total Hors Taxes
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHT: number;

  /**
   * Montant total de la TVA
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTVA: number;

  /**
   * Montant total Toutes Taxes Comprises
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTTC: number;

  // ========== CONDITIONS DE PAIEMENT (OBLIGATOIRES) ==========

  /**
   * Délai de paiement en jours (défaut: 30 jours depuis 2025)
   */
  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  /**
   * Taux de pénalité de retard (légal = taux BCE + 10 points)
   * Stocké en pourcentage (ex: 13.5 pour 13.5%)
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 13.5 })
  latePaymentInterestRate: number;

  /**
   * Indemnité forfaitaire pour frais de recouvrement (obligatoire 40€)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 40 })
  recoveryIndemnity: number;

  // ========== MENTIONS LÉGALES COMPLÉMENTAIRES ==========

  /**
   * Mention spéciale TVA (si applicable)
   * Ex: "TVA non applicable, article 293 B du CGI"
   */
  @Column({ type: 'text', nullable: true })
  vatMention?: string;

  /**
   * Notes et conditions supplémentaires
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ========== LIGNES DE FACTURE ==========

  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
    eager: true,
  })
  items: InvoiceItem[];

  // ========== FACTUR-X / PDF ==========

  /**
   * Chemin du fichier PDF généré (Factur-X compatible)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  pdfPath?: string;

  /**
   * Hash SHA256 du PDF généré (pour vérification intégrité)
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  pdfHash?: string;

  /**
   * Facture d'origine (si c'est un avoir/credit note)
   */
  @Column({ type: 'uuid', nullable: true })
  originalInvoiceId?: string;

  // ========== AUDIT ==========

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Date de validation (passage au statut VALIDATED)
   * Après cette date, la facture devient IMMUTABLE
   */
  @Column({ type: 'timestamp', nullable: true })
  validatedAt?: Date;

  /**
   * Date de paiement
   */
  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatutInformationPaiement {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  EXPIRE = 'EXPIRE',
  SUSPENDU = 'SUSPENDU',
}

/**
 * InformationPaiementBancaireEntity stores IBAN/BIC payment information in clear text.
 * This entity is used for storing bank account details for SEPA direct debit payments.
 * 
 * IMPORTANT: IBAN and BIC are stored in PLAIN TEXT (no encryption) as per requirements.
 */
@Entity('information_paiement_bancaire')
export class InformationPaiementBancaireEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  /**
   * IBAN - International Bank Account Number (stored in clear text)
   * Max length: 34 characters (IBAN standard)
   */
  @Column({ type: 'varchar', length: 34 })
  @Index()
  iban: string;

  /**
   * BIC - Bank Identifier Code (stored in clear text)
   * Max length: 11 characters (BIC standard)
   */
  @Column({ type: 'varchar', length: 11 })
  bic: string;

  /**
   * Nom du titulaire du compte bancaire
   */
  @Column({ name: 'titulaire_compte', type: 'varchar', length: 255, nullable: true })
  titulaireCompte: string | null;

  /**
   * Référence du mandat SEPA
   */
  @Column({ name: 'mandat_sepa_reference', type: 'varchar', length: 255, nullable: true })
  mandatSepaReference: string | null;

  /**
   * Date de signature du mandat SEPA
   */
  @Column({ name: 'date_mandat', type: 'timestamp', nullable: true })
  dateMandat: Date | null;

  /**
   * Statut de l'information de paiement
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: StatutInformationPaiement.ACTIF,
  })
  statut: string;

  /**
   * Commentaire libre
   */
  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  /**
   * External ID from legacy system (for import matching)
   * Unique per organisation_id
   */
  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  externalId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  isActif(): boolean {
    return this.statut === StatutInformationPaiement.ACTIF;
  }

  canBeUsedForPayment(): boolean {
    return this.statut === StatutInformationPaiement.ACTIF && !!this.iban && !!this.bic;
  }

  /**
   * Returns masked IBAN for display purposes (shows only last 4 characters)
   * Example: FR76**********************1234
   */
  getMaskedIban(): string {
    if (!this.iban || this.iban.length < 4) {
      return '****';
    }
    const last4 = this.iban.slice(-4);
    const masked = '*'.repeat(this.iban.length - 4);
    return masked + last4;
  }
}

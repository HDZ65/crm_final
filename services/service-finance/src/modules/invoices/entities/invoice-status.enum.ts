/**
 * Statuts possibles d'une facture
 * Conformité légale française : Une facture VALIDATED ne peut plus être modifiée
 */
export enum InvoiceStatus {
  /** Facture en cours de création (brouillon) */
  DRAFT = 'DRAFT',

  /** Facture validée et envoyée au client - IMMUTABLE */
  VALIDATED = 'VALIDATED',

  /** Facture payée */
  PAID = 'PAID',

  /** Facture annulée (seul un avoir peut être créé) */
  CANCELLED = 'CANCELLED',

  /** Avoir (credit note) - facture de remboursement */
  CREDIT_NOTE = 'CREDIT_NOTE',
}

/**
 * Statuts qui bloquent toute modification
 */
export const IMMUTABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.VALIDATED,
  InvoiceStatus.PAID,
  InvoiceStatus.CANCELLED,
  InvoiceStatus.CREDIT_NOTE,
];

/**
 * Statuts possibles d'une facture
 * Conformite legale francaise : Une facture VALIDATED ne peut plus etre modifiee
 */
export enum InvoiceStatus {
  /** Facture en cours de creation (brouillon) */
  DRAFT = 'DRAFT',

  /** Facture validee et envoyee au client - IMMUTABLE */
  VALIDATED = 'VALIDATED',

  /** Facture payee */
  PAID = 'PAID',

  /** Facture annulee (seul un avoir peut etre cree) */
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

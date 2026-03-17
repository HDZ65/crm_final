/**
 * FEC (Fichier des Écritures Comptables) types
 * Conformes à l'article A47 A-1 du Livre des Procédures Fiscales (LPF)
 */

export interface FecEntry {
  JournalCode: string;    // Code journal (ex: VT, BAN, OD)
  JournalLib: string;     // Libellé journal
  EcritureNum: string;    // Numéro séquentiel de l'écriture
  EcritureDate: string;   // Date écriture YYYYMMDD
  CompteNum: string;      // Numéro de compte PCG (ex: 411000)
  CompteLib: string;      // Libellé compte
  CompAuxNum: string;     // Compte auxiliaire (tiers)
  CompAuxLib: string;     // Libellé compte auxiliaire
  PieceRef: string;       // Référence pièce (numéro facture)
  PieceDate: string;      // Date pièce YYYYMMDD
  EcritureLib: string;    // Libellé écriture
  Debit: string;          // Montant débit (format: 1234.56, '' si crédit)
  Credit: string;         // Montant crédit (format: 1234.56, '' si débit)
  EcritureLet: string;    // Code lettrage (vide si non lettré)
  DateLet: string;        // Date lettrage YYYYMMDD (vide si non lettré)
  ValidDate: string;      // Date de validation YYYYMMDD
  Montantdevise: string;  // Montant en devise étrangère (vide si EUR)
  Idevise: string;        // Code devise ISO (EUR, USD, etc.)
}

/** Les 18 colonnes FEC dans l'ordre normatif */
export const FEC_COLUMNS: (keyof FecEntry)[] = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
  'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
];

/** Séparateur FEC : tabulation (norme légale) */
export const FEC_SEPARATOR = '\t';

/** Encodage FEC : windows-1252 (norme légale) */
export const FEC_ENCODING = 'windows-1252';

export enum JournalType {
  VENTES = 'VENTES',
  REGLEMENTS = 'REGLEMENTS',
  IMPAYES = 'IMPAYES',
}

export interface JournalConfig {
  code: string;
  libelle: string;
  compte_debit_defaut: string;
  compte_credit_defaut: string;
  compte_tva?: string;
}

export const DEFAULT_JOURNAL_CONFIGS: Record<JournalType, JournalConfig> = {
  [JournalType.VENTES]: {
    code: 'VT',
    libelle: 'Journal des Ventes',
    compte_debit_defaut: '411000',
    compte_credit_defaut: '706000',
    compte_tva: '445710',
  },
  [JournalType.REGLEMENTS]: {
    code: 'BAN',
    libelle: 'Journal des Règlements',
    compte_debit_defaut: '512000',
    compte_credit_defaut: '411000',
  },
  [JournalType.IMPAYES]: {
    code: 'IMP',
    libelle: 'Journal des Impayés',
    compte_debit_defaut: '416000',
    compte_credit_defaut: '411000',
  },
};

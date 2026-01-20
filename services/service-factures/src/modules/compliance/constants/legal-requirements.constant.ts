/**
 * Constantes pour la conformité légale française des factures
 * Sources:
 * - Service-Public.fr: https://entreprendre.service-public.fr/vosdroits/F31808
 * - Code Général des Impôts (CGI) Article 242 nonies A
 * - Décret n°2022-1299 du 7 octobre 2022
 */

/**
 * Configuration entreprise émettrice (à charger depuis .env)
 */
export interface CompanyInfo {
  name: string;
  address: string;
  siret: string; // 14 chiffres
  siren: string; // 9 chiffres
  tvaNumber: string; // Format: FR + 2 chiffres clé + 9 chiffres SIREN
  rcs?: string; // Registre du Commerce et des Sociétés
  capital?: number; // Capital social en euros
  email: string;
  phone: string;
}

/**
 * Mentions légales obligatoires sur toute facture française
 */
export const MANDATORY_MENTIONS = {
  /**
   * Numérotation séquentielle obligatoire
   * Article 242 nonies A du CGI
   */
  SEQUENTIAL_NUMBER:
    'Numérotation séquentielle continue et chronologique sans rupture',

  /**
   * Délais de paiement (défaut 30 jours depuis 2025)
   */
  PAYMENT_TERMS: 'Délai de paiement : {days} jours à compter de la date d\'émission',

  /**
   * Pénalités de retard (taux BCE + 10 points)
   */
  LATE_PAYMENT_PENALTY:
    'En cas de retard de paiement, application de pénalités de retard au taux de {rate}% par an (taux BCE + 10 points)',

  /**
   * Indemnité forfaitaire de recouvrement (obligatoire 40€)
   */
  RECOVERY_INDEMNITY:
    'Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : {amount}€',

  /**
   * Garantie légale de conformité (pour ventes à particuliers)
   */
  LEGAL_WARRANTY:
    'Garantie légale de conformité : 2 ans minimum à compter de la délivrance du bien',

  /**
   * Franchise de TVA (si applicable)
   */
  TVA_FRANCHISE: 'TVA non applicable, article 293 B du Code général des impôts',

  /**
   * Exonération de TVA (si applicable - à préciser l'article)
   */
  TVA_EXEMPTION:
    'Opération exonérée de TVA - Article {article} du Code général des impôts',

  /**
   * Autoliquidation TVA (si applicable)
   */
  TVA_REVERSE_CHARGE: 'Autoliquidation de la TVA par le preneur',
};

/**
 * Taux de TVA standards en France (2025)
 */
export const VAT_RATES = {
  STANDARD: 20.0, // Taux normal
  INTERMEDIATE: 10.0, // Taux intermédiaire
  REDUCED: 5.5, // Taux réduit
  SUPER_REDUCED: 2.1, // Taux super réduit
  ZERO: 0.0, // Taux zéro
} as const;

/**
 * Délai de paiement maximum légal (2025)
 */
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;

/**
 * Taux de pénalité de retard minimum (taux BCE + 10 points)
 * À mettre à jour selon le taux de la BCE
 */
export const DEFAULT_LATE_PAYMENT_RATE = 13.5; // Exemple: 3.5% (BCE) + 10% = 13.5%

/**
 * Indemnité forfaitaire de recouvrement (fixe)
 */
export const RECOVERY_INDEMNITY_AMOUNT = 40; // 40€ fixe

/**
 * Validation des mentions obligatoires
 */
export interface InvoiceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Liste des champs obligatoires sur une facture
 */
export const REQUIRED_INVOICE_FIELDS = [
  'invoiceNumber',
  'issueDate',
  'deliveryDate',
  'customerName',
  'customerAddress',
  'totalHT',
  'totalTVA',
  'totalTTC',
  'items',
] as const;

/**
 * Liste des champs obligatoires sur une ligne de facture
 */
export const REQUIRED_ITEM_FIELDS = [
  'description',
  'quantity',
  'unitPriceHT',
  'vatRate',
  'totalHT',
  'totalTVA',
  'totalTTC',
] as const;

/**
 * Commission Display Types
 *
 * Frontend-specific types for the commission module:
 * - String literal types matching API values
 * - Enriched display types with joined/nested data
 * - Filter types for UI queries
 * - Small UI-only DTOs
 *
 * For gRPC base types, import directly from @proto/commission/commission.
 * For gRPC enums, import directly from @proto/commission/commission.
 */

// ============================================
// Frontend-friendly string literal types
// These match the values actually sent/received by the API
// ============================================
export type TypeApporteur = "vrp" | "manager" | "directeur" | "partenaire";
export type TypeBase = "cotisation_ht" | "ca_ht" | "forfait";
export type TypeCalcul = "fixe" | "pourcentage" | "palier" | "mixte";
export type TypePalier = "volume" | "ca" | "prime_produit";
export type TypeProduit =
  | "telecom"
  | "assurance_sante"
  | "prevoyance"
  | "energie"
  | "depanssur"
  | "mondial_tv"
  | "conciergerie";
export type CanalVente = "terrain" | "web" | "televente";
export type TypeReprise = "resiliation" | "impaye" | "annulation" | "regularisation";
export type StatutReprise = "en_attente" | "appliquee" | "annulee";
export type StatutBordereau = "brouillon" | "valide" | "exporte" | "archive";
export type TypeLigne = "commission" | "reprise" | "acompte" | "prime" | "regularisation";
export type StatutLigne = "selectionnee" | "deselectionnee" | "validee" | "rejetee";
export type StatutContestation = "en_cours" | "acceptee" | "rejetee";

// ============================================
// Enriched types for frontend display
// These include joined/nested data not in base gRPC types
// ============================================

/** Apporteur info for display */
export interface ApporteurInfo {
  id: string;
  nom: string;
  prenom: string;
  typeApporteur: TypeApporteur;
}

/** Contrat info for display */
export interface ContratInfo {
  id: string;
  referenceExterne: string;
  clientNom: string;
}

/** Produit info for display */
export interface ProduitInfo {
  id: string;
  nom: string;
  sku: string;
}

/** Statut info for display */
export interface StatutInfo {
  id: string;
  code: string;
  nom: string;
}

/** Commission with all related entities for detail views */
export interface CommissionWithDetails {
  id: string;
  organisationId: string;
  reference: string;
  compagnie: string;
  typeBase: TypeBase;
  montantBrut: string;
  montantReprises: string;
  montantAcomptes: string;
  montantNetAPayer: string;
  periode: string;
  dateCreation: Date | string;
  apporteur: ApporteurInfo | null;
  contrat: ContratInfo | null;
  produit: ProduitInfo | null;
  statut: StatutInfo | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Bordereau with apporteur info */
export interface BordereauWithDetails {
  id: string;
  organisationId: string;
  reference: string;
  periode: string;
  apporteurId: string;
  totalBrut: string;
  totalReprises: string;
  totalAcomptes: string;
  totalNetAPayer: string;
  nombreLignes: number;
  statutBordereau: StatutBordereau;
  dateValidation: Date | string | null;
  validateurId: string | null;
  dateExport: Date | string | null;
  fichierPdfUrl: string | null;
  fichierExcelUrl: string | null;
  commentaire: string | null;
  creePar: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  apporteur: ApporteurInfo | null;
}

/** Reprise with related info */
export interface RepriseWithDetails {
  id: string;
  organisationId: string;
  commissionOriginaleId: string;
  contratId: string;
  apporteurId: string;
  reference: string;
  typeReprise: TypeReprise;
  montantReprise: string;
  tauxReprise: string;
  montantOriginal: string;
  periodeOrigine: string;
  periodeApplication: string;
  dateEvenement: Date | string;
  dateLimite: Date | string;
  dateApplication: Date | string | null;
  statutReprise: StatutReprise;
  bordereauId: string | null;
  motif: string | null;
  commentaire: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  apporteur: ApporteurInfo | null;
  contrat: ContratInfo | null;
}

/** Contestation with related info */
export interface ContestationWithDetails {
  id: string;
  organisationId: string;
  commissionId: string;
  bordereauId: string;
  apporteurId: string;
  motif: string;
  dateContestation: Date | string;
  dateLimite: Date | string;
  statut: StatutContestation;
  commentaireResolution: string | null;
  resoluPar: string | null;
  dateResolution: Date | string | null;
  ligneRegularisationId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  apporteur: ApporteurInfo | null;
}

/** Bareme with paliers for configuration view */
export interface BaremeWithPaliers {
  id: string;
  organisationId: string;
  code: string;
  nom: string;
  description: string | null;
  typeCalcul: TypeCalcul;
  baseCalcul: TypeBase;
  montantFixe: string | null;
  tauxPourcentage: string | null;
  precomptee?: boolean;
  recurrenceActive: boolean;
  tauxRecurrence: string | null;
  dureeRecurrenceMois: number | null;
  dureeReprisesMois: number;
  tauxReprise: string;
  typeProduit: TypeProduit | string | null;
  gammeId: string | null;
  produitId: string | null;
  profilRemuneration: TypeApporteur | string | null;
  societeId: string | null;
  canalVente: CanalVente | string | null;
  repartitionCommercial: string;
  repartitionManager: string;
  repartitionAgence: string;
  repartitionEntreprise: string;
  version: number;
  dateEffet: Date | string;
  dateFin: Date | string | null;
  actif: boolean;
  creePar: string | null;
  modifiePar: string | null;
  motifModification: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  paliers?: PalierDisplay[];
}

/** Palier for display */
export interface PalierDisplay {
  id: string;
  organisationId: string;
  baremeId: string;
  code: string;
  nom: string;
  description: string | null;
  typePalier: TypePalier;
  seuilMin: string;
  seuilMax: string | null;
  montantPrime: string;
  tauxBonus: string | null;
  cumulable: boolean;
  parPeriode: boolean;
  typeProduit: TypeProduit | null;
  gammeId?: string | null;
  produitId?: string | null;
  ordre: number;
  actif: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// Filter types for queries
// ============================================
export interface CommissionFilters {
  organisationId?: string;
  apporteurId?: string;
  periode?: string;
  statutId?: string;
}

export interface BaremeFilters {
  organisationId?: string;
  actifs?: boolean;
  typeProduit?: TypeProduit;
}

export interface BordereauFilters {
  organisationId?: string;
  apporteurId?: string;
  periode?: string;
  statut?: StatutBordereau;
}

export interface RepriseFilters {
  organisationId?: string;
  apporteurId?: string;
  contratId?: string;
  periode?: string;
  enAttente?: boolean;
}

export interface PalierFilters {
  organisationId?: string;
  baremeId?: string;
  actifs?: boolean;
}

export interface ApporteurFilters {
  organisationId?: string;
}

export interface BaremeApplicableFilters {
  organisationId: string;
  typeProduit?: TypeProduit;
  profilRemuneration?: TypeApporteur;
}

export interface PalierApplicableFilters {
  baremeId: string;
  typePalier: TypePalier;
  valeur: number;
}

export interface LigneBordereauFilters {
  bordereauId: string;
  selectionnees?: boolean;
}

// ============================================
// Summary types for UI
// ============================================
export interface CommissionSummary {
  totalBrut: number;
  totalReprises: number;
  totalAcomptes: number;
  totalNet: number;
  nombreLignes: number;
  nombreSelectionnes: number;
}

// ============================================
// Statut commission display (enriched type)
// ============================================
export interface StatutCommissionDisplay extends StatutInfo {
  description?: string | null;
  ordreAffichage: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// Ligne bordereau display
// ============================================
export interface LigneBordereauDisplay {
  id: string;
  organisationId: string;
  bordereauId: string;
  commissionId: string | null;
  repriseId: string | null;
  typeLigne: TypeLigne;
  contratId: string;
  contratReference: string;
  clientNom: string | null;
  produitNom: string | null;
  montantBrut: string;
  montantReprise: string;
  montantNet: string;
  baseCalcul: TypeBase | null;
  tauxApplique: string | null;
  baremeId: string | null;
  statutLigne: StatutLigne;
  selectionne: boolean;
  motifDeselection: string | null;
  validateurId: string | null;
  dateValidation: Date | string | null;
  ordre: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// Aggregated response types for UI
// ============================================
export interface CalculerCommissionResponse {
  commission: CommissionWithDetails | null;
  bareme: BaremeWithPaliers | null;
  primes: PalierDisplay[];
  erreur?: string;
}

export interface GenererBordereauResponse {
  bordereau: BordereauWithDetails;
  lignes: LigneBordereauDisplay[];
  nombreCommissions: number;
  nombreReprises: number;
  totalBrut: string;
  totalReprises: string;
  totalNet: string;
}

// ============================================
// Small UI-only mutation DTOs
// ============================================
export interface AnnulerRepriseDto {
  motif: string;
}

export interface ValiderBordereauDto {
  commentaire?: string;
}

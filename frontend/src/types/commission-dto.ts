// ============================================
// Commission Module - API Response DTOs
// ============================================

// Enums for type safety
export type TypeApporteur = 'vrp' | 'manager' | 'directeur' | 'partenaire'
export type TypeBase = 'cotisation_ht' | 'ca_ht' | 'forfait'
export type TypeCalcul = 'fixe' | 'pourcentage' | 'palier' | 'mixte'
export type TypePalier = 'volume' | 'ca' | 'prime_produit'
export type TypeProduit = 'telecom' | 'assurance_sante' | 'prevoyance' | 'energie' | 'depanssur' | 'mondial_tv' | 'conciergerie'
export type CanalVente = 'terrain' | 'web' | 'televente'
export type TypeReprise = 'resiliation' | 'impaye' | 'annulation' | 'regularisation'
export type StatutReprise = 'en_attente' | 'appliquee' | 'annulee'
export type StatutBordereau = 'brouillon' | 'valide' | 'exporte' | 'archive'
export type TypeLigne = 'commission' | 'reprise' | 'acompte' | 'prime' | 'regularisation'
export type StatutLigne = 'selectionnee' | 'deselectionnee' | 'validee' | 'rejetee'

// ============================================
// 1. Apporteurs
// ============================================
export interface ApporteurResponseDto {
  id: string
  organisationId: string
  utilisateurId?: string | null
  nom: string
  prenom: string
  typeApporteur: TypeApporteur
  email?: string | null
  telephone?: string | null
  actif: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ApporteurFilters {
  organisationId?: string
}

// ============================================
// 2. Statuts Commission
// ============================================
export interface StatutCommissionResponseDto {
  id: string
  code: string
  nom: string
  description?: string | null
  ordreAffichage: number
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================
// 3. Commissions
// ============================================
export interface CommissionResponseDto {
  id: string
  organisationId: string
  reference: string
  apporteurId: string
  contratId: string
  produitId?: string | null
  compagnie: string
  typeBase: TypeBase
  montantBrut: number
  montantReprises: number
  montantAcomptes: number
  montantNetAPayer: number
  statutId: string
  periode: string // 'YYYY-MM'
  dateCreation: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CommissionWithDetailsResponseDto {
  id: string
  organisationId: string
  reference: string
  compagnie: string
  typeBase: TypeBase
  montantBrut: number
  montantReprises: number
  montantAcomptes: number
  montantNetAPayer: number
  periode: string // 'YYYY-MM'
  dateCreation: Date | string
  apporteur: { id: string; nom: string; prenom: string; typeApporteur: TypeApporteur } | null
  contrat: { id: string; referenceExterne: string; clientNom: string } | null
  produit: { id: string; nom: string; sku: string } | null
  statut: { id: string; code: string; nom: string } | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CommissionFiltersDto {
  organisationId?: string
  apporteurId?: string
  periode?: string
}

// ============================================
// 4. Barèmes Commission
// ============================================
export interface BaremeCommissionResponseDto {
  id: string
  organisationId: string
  code: string
  nom: string
  description: string | null
  typeCalcul: TypeCalcul
  baseCalcul: TypeBase
  montantFixe: number | null
  tauxPourcentage: number | null
  precomptee: boolean
  recurrenceActive: boolean
  tauxRecurrence: number | null
  dureeRecurrenceMois: number | null
  dureeReprisesMois: number // 3, 6 ou 12
  tauxReprise: number // 100 par défaut
  typeProduit: TypeProduit | null
  profilRemuneration: TypeApporteur | null
  societeId: string | null
  canalVente: CanalVente | null
  // Répartition (doit totaliser 100%)
  repartitionCommercial: number
  repartitionManager: number
  repartitionAgence: number
  repartitionEntreprise: number
  version: number
  dateEffet: Date | string
  dateFin: Date | string | null
  actif: boolean
  creePar: string | null
  modifiePar: string | null
  motifModification: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BaremeFiltersDto {
  organisationId?: string
  actifs?: boolean
  typeProduit?: TypeProduit
}

export interface BaremeApplicableFiltersDto {
  organisationId: string // requis
  typeProduit?: TypeProduit
  profilRemuneration?: TypeApporteur
}

// ============================================
// 5. Paliers Commission
// ============================================
export interface PalierCommissionResponseDto {
  id: string
  organisationId: string
  baremeId: string
  code: string
  nom: string
  description: string | null
  typePalier: TypePalier
  seuilMin: number
  seuilMax: number | null
  montantPrime: number
  tauxBonus: number | null
  cumulable: boolean
  parPeriode: boolean
  typeProduit: TypeProduit | null
  ordre: number
  actif: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface PalierFiltersDto {
  organisationId?: string
  baremeId?: string
  actifs?: boolean
}

export interface PalierApplicableFiltersDto {
  baremeId: string // requis
  typePalier: TypePalier // requis
  valeur: number // requis
}

// ============================================
// 6. Reprises Commission
// ============================================
export interface RepriseCommissionResponseDto {
  id: string
  organisationId: string
  commissionOriginaleId: string
  contratId: string
  apporteurId: string
  reference: string
  typeReprise: TypeReprise
  montantReprise: number // Négatif
  tauxReprise: number
  montantOriginal: number
  periodeOrigine: string // 'YYYY-MM'
  periodeApplication: string
  dateEvenement: Date | string
  dateLimite: Date | string
  dateApplication: Date | string | null
  statutReprise: StatutReprise
  bordereauId: string | null
  motif: string | null
  commentaire: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RepriseFiltersDto {
  organisationId?: string
  apporteurId?: string
  contratId?: string
  periode?: string
  enAttente?: boolean
}

// ============================================
// 7. Bordereaux Commission
// ============================================
export interface BordereauCommissionResponseDto {
  id: string
  organisationId: string
  reference: string // 'BRD-2024-01-001'
  periode: string // 'YYYY-MM'
  apporteurId: string
  totalBrut: number
  totalReprises: number
  totalAcomptes: number
  totalNetAPayer: number
  nombreLignes: number
  statutBordereau: StatutBordereau
  dateValidation: Date | string | null
  validateurId: string | null
  dateExport: Date | string | null
  fichierPdfUrl: string | null
  fichierExcelUrl: string | null
  commentaire: string | null
  creePar: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BordereauWithDetailsResponseDto extends BordereauCommissionResponseDto {
  apporteur: { id: string; nom: string; prenom: string; typeApporteur: TypeApporteur } | null
}

export interface BordereauFiltersDto {
  organisationId?: string
  apporteurId?: string
  periode?: string
  statut?: StatutBordereau
}

// ============================================
// 8. Lignes Bordereau
// ============================================
export interface LigneBordereauResponseDto {
  id: string
  organisationId: string
  bordereauId: string
  commissionId: string | null
  repriseId: string | null
  typeLigne: TypeLigne
  contratId: string
  contratReference: string
  clientNom: string | null
  produitNom: string | null
  montantBrut: number
  montantReprise: number
  montantNet: number
  baseCalcul: TypeBase | null
  tauxApplique: number | null
  baremeId: string | null
  statutLigne: StatutLigne
  selectionne: boolean
  motifDeselection: string | null
  validateurId: string | null
  dateValidation: Date | string | null
  ordre: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface LigneBordereauFiltersDto {
  bordereauId: string // requis
  selectionnees?: boolean
}

// ============================================
// 9. Commission Engine (POST DTOs)
// ============================================
export interface CalculerCommissionDto {
  organisationId: string
  contratId: string
  apporteurId: string
  periode: string
  montantBase: number
  typeProduit?: TypeProduit
}

export interface CalculerCommissionResponseDto {
  commission: CommissionResponseDto | null
  bareme: BaremeCommissionResponseDto | null
  primes: PalierCommissionResponseDto[]
  erreur?: string
}

export interface GenererBordereauDto {
  organisationId: string
  apporteurId: string
  periode: string
  commissionIds?: string[]
}

export interface GenererBordereauResponseDto {
  bordereau: BordereauCommissionResponseDto
  lignes: LigneBordereauResponseDto[]
  nombreCommissions: number
  nombreReprises: number
  totalBrut: number
  totalReprises: number
  totalNet: number
}

export interface DeclencherRepriseDto {
  organisationId: string
  commissionId: string
  typeReprise: TypeReprise
  motif?: string
  commentaire?: string
}

// ============================================
// Summary types for UI
// ============================================
export interface CommissionSummaryDto {
  totalBrut: number
  totalReprises: number
  totalAcomptes: number
  totalNet: number
  nombreLignes: number
  nombreSelectionnes: number
}

// ============================================
// Mutation DTOs (Create/Update)
// ============================================

// Apporteurs
export interface CreateApporteurDto {
  organisationId: string
  nom: string
  prenom: string
  typeApporteur: TypeApporteur
  email?: string
  telephone?: string
}

export interface UpdateApporteurDto {
  nom?: string
  prenom?: string
  typeApporteur?: TypeApporteur
  email?: string
  telephone?: string
  actif?: boolean
}

// Reprises
export interface AnnulerRepriseDto {
  motif: string
}

// Bordereaux
export interface ValiderBordereauDto {
  commentaire?: string
}

// Barèmes
export interface CreateBaremeDto {
  organisationId: string
  code: string
  nom: string
  description?: string
  typeCalcul: TypeCalcul
  baseCalcul: TypeBase
  montantFixe?: number
  tauxPourcentage?: number
  precomptee?: boolean
  recurrenceActive?: boolean
  tauxRecurrence?: number
  dureeRecurrenceMois?: number
  dureeReprisesMois?: number
  tauxReprise?: number
  typeProduit?: string
  profilRemuneration?: string
  societeId?: string
  canalVente?: CanalVente
  repartitionCommercial?: number
  repartitionManager?: number
  repartitionAgence?: number
  repartitionEntreprise?: number
  dateEffet: string
  dateFin?: string
}

export interface UpdateBaremeDto {
  nom?: string
  description?: string
  typeCalcul?: TypeCalcul
  baseCalcul?: TypeBase
  montantFixe?: number
  tauxPourcentage?: number
  precomptee?: boolean
  recurrenceActive?: boolean
  tauxRecurrence?: number
  dureeRecurrenceMois?: number
  dureeReprisesMois?: number
  tauxReprise?: number
  typeProduit?: string
  profilRemuneration?: string
  societeId?: string
  canalVente?: CanalVente
  repartitionCommercial?: number
  repartitionManager?: number
  repartitionAgence?: number
  repartitionEntreprise?: number
  dateFin?: string
  actif?: boolean
  motifModification?: string
}

// Paliers
export interface CreatePalierDto {
  organisationId: string
  baremeId: string
  code: string
  nom: string
  description?: string
  typePalier: TypePalier
  seuilMin: number
  seuilMax?: number
  montantPrime: number
  tauxBonus?: number
  cumulable?: boolean
  parPeriode?: boolean
  typeProduit?: string
  ordre?: number
}

export interface UpdatePalierDto {
  code?: string
  nom?: string
  description?: string
  typePalier?: TypePalier
  seuilMin?: number
  seuilMax?: number
  montantPrime?: number
  tauxBonus?: number
  cumulable?: boolean
  parPeriode?: boolean
  typeProduit?: string
  ordre?: number
  actif?: boolean
}

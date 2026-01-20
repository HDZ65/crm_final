// =====================================
// Filter Types
// =====================================

export type PeriodeRapide =
  | "mois_courant"
  | "mois_dernier"
  | "trimestre_courant"
  | "annee_courante"
  | "personnalisee"

export interface StatsFilters {
  organisationId?: string
  societeId?: string
  produitId?: string
  canal?: string
  dateDebut?: string
  dateFin?: string
  periodeRapide?: PeriodeRapide
  // UI-specific filters (component compatibility)
  periode?: string
  societe?: string
  produit?: string
}

export type UserRole = "DIRECTION" | "MANAGER" | "COMMERCIAL" | "ADV"

export interface StatsUser {
  userId: string
  role: UserRole
  companyId?: string
  agencyId?: string
}

// =====================================
// KPI Types (GET /dashboard/kpis)
// =====================================

export interface KPIVariation {
  pourcentage: number
  tendance: "hausse" | "baisse" | "stable"
}

export interface DashboardKPIsResponse {
  contratsActifs: number
  contratsActifsVariation: KPIVariation
  mrr: number
  mrrVariation: KPIVariation
  tauxChurn: number
  tauxChurnVariation: KPIVariation
  tauxImpayes: number
  tauxImpayesVariation: KPIVariation
}

// Legacy KPICard type for component compatibility
export interface KPICard {
  label: string
  value: number | string
  evolution?: number
  format?: "number" | "currency" | "percentage"
  status?: "success" | "warning" | "danger" | "neutral"
}

// =====================================
// CA Evolution Types (GET /dashboard/evolution-ca)
// =====================================

export interface CAEvolutionData {
  mois: string
  caRealise: number
  objectif: number
}

export interface CAEvolutionResponse {
  periodeDebut: string
  periodeFin: string
  donnees: CAEvolutionData[]
}

// Legacy type for component compatibility
export interface CAEvolution {
  mois: string
  ca: number
  objectif: number
}

// =====================================
// Product Distribution Types (GET /dashboard/repartition-produits)
// =====================================

export interface ProductDistributionItem {
  produitId: string
  nomProduit: string
  ca: number
  pourcentage: number
  couleur: string
}

export interface ProductDistributionResponse {
  caTotal: number
  produits: ProductDistributionItem[]
}

// Legacy type for component compatibility
export interface ProductStats {
  produit: string
  contratsActifs: number
  ca: number
  nouveauxClients: number
}

// =====================================
// Company Stats Types (GET /dashboard/stats-societes)
// =====================================

export interface CompanyStatsItem {
  societeId: string
  nomSociete: string
  contratsActifs: number
  mrr: number
  arr: number
  nouveauxClients: number
  nouveauxClientsVariation: number
  tauxChurn: number
  tauxImpayes: number
}

export interface CompanyStatsResponse {
  societes: CompanyStatsItem[]
  total: number
}

// Legacy type for component compatibility
export interface CompanyStats {
  companyId: string
  companyName: string
  contratsActifs: number
  mrr: number
  arr: number
  nouveauxClients: number
  tauxChurn: number
  tauxImpayes: number
}

// =====================================
// Alerts Types (GET /dashboard/alertes)
// =====================================

export type AlertLevel = "critique" | "avertissement" | "info"

export type AlertType =
  | "taux_impayes"
  | "taux_churn"
  | "controles_qualite"
  | "doublon"

export interface AlertItem {
  id: string
  titre: string
  description: string
  niveau: AlertLevel
  type: AlertType
  valeurActuelle: number
  seuil: number
  dateDetection: string
  entiteConcernee?: string
  entiteId?: string
}

export interface AlertsResponse {
  alertes: AlertItem[]
  total: number
  nombreCritiques: number
  nombreAvertissements: number
  nombreInfos: number
}

// Legacy type for component compatibility
export interface Alert {
  id: string
  type: "impaye" | "churn" | "cq" | "doublon"
  severity: "warning" | "danger"
  title: string
  description: string
  value: number
  threshold: number
  date: Date
}

// =====================================
// Commercial Ranking Types
// =====================================

export interface CommercialRanking {
  userId: string
  name: string
  ventes: number
  ca: number
  tauxConversion: number
  panierMoyen: number
}

// =====================================
// Commercial KPIs Types (GET /dashboard/kpis-commerciaux)
// =====================================

export interface CommercialRankingItem {
  commercialId: string
  nomComplet: string
  valeur: number
  rang: number
}

export interface CommercialKPIsResponse {
  nouveauxClientsMois: number
  nouveauxClientsVariation: KPIVariation
  tauxConversion: number
  tauxConversionVariation: KPIVariation
  panierMoyen: number
  panierMoyenVariation: KPIVariation
  caPrevisionnel3Mois: number
  classementParVentes: CommercialRankingItem[]
  classementParCA: CommercialRankingItem[]
  classementParConversion: CommercialRankingItem[]
}

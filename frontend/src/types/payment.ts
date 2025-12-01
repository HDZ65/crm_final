// Payment types for SEPA & CB payment management module

export type PaymentStatus =
  | "PENDING" // En attente
  | "SUBMITTED" // Soumis au PSP
  | "PAID" // Payé
  | "REJECT_INSUFF_FUNDS" // Rejet insuffisance de fonds (AM04)
  | "REJECT_OTHER" // Rejet autre motif
  | "REFUNDED" // Remboursé
  | "CANCELLED" // Annulé
  | "API_ERROR" // Erreur API
  | "RETRY_SCHEDULED" // Réémission planifiée

export type PaymentMethod = "SEPA" | "CB" // Prélèvement SEPA ou Carte Bancaire

export type PaymentType =
  | "EMISSION" // Émission initiale
  | "REEMISSION" // Réémission (après rejet)
  | "REFUND" // Remboursement
  | "CANCELLATION" // Annulation

export type PSPProvider =
  | "Slimpay"
  | "MultiSafepay"
  | "Emerchantpay"
  | "GoCardless"

export type DebitLot = "L1" | "L2" | "L3" | "L4" // Lots hebdomadaires

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" // Niveau de risque client

export type SourceChannel =
  | "TERRAIN" // Vente terrain
  | "TELEFILTRAGE" // Télévente
  | "INTERNET" // Vente en ligne
  | "PARTENAIRE" // Vente partenaire

export interface Payment {
  id: string
  payment_reference: string // Référence unique du paiement

  // Relations
  client_id: string
  client_name: string
  contract_id: string
  contract_reference: string
  company: "France Téléphone" | "Mondial TV" | "Action Prévoyance" | "Dépanssur"

  // Informations financières
  amount: number
  currency: string
  payment_method: PaymentMethod

  // Statut et type
  status: PaymentStatus
  payment_type: PaymentType

  // PSP et routage
  psp_provider: PSPProvider
  psp_transaction_id?: string

  // Calendrier et planification
  planned_debit_date: string // Date planifiée de prélèvement
  actual_debit_date?: string // Date réelle de prélèvement
  preferred_debit_day?: number // Jour préféré (1-28)
  debit_lot?: DebitLot // Lot hebdomadaire

  // Scoring et risque
  risk_score?: number // Score de 0-100
  risk_tier?: RiskTier

  // Réémission
  retry_count?: number
  max_retry_attempts?: number
  next_retry_date?: string

  // Informations commerciales
  commercial_name?: string
  source_channel?: SourceChannel

  // Mandat SEPA
  rum?: string // Référence Unique du Mandat
  iban_masked?: string // IBAN masqué (FR76 **** **** 1234)

  // Produit
  product_name?: string
  product_code?: string

  // Métadonnées
  created_at: string
  updated_at: string
  submitted_at?: string
  paid_at?: string

  // Raison du rejet
  reject_reason?: string
  reject_code?: string // Code ISO (ex: AM04, AM05, etc.)

  // Notes et commentaires
  notes?: string
}

export interface PaymentFilters {
  search?: string // Recherche globale (client, contrat, référence)
  company?: string
  status?: PaymentStatus
  payment_method?: PaymentMethod
  psp_provider?: PSPProvider
  debit_lot?: DebitLot
  risk_tier?: RiskTier
  source_channel?: SourceChannel
  commercial_name?: string
  date_from?: string
  date_to?: string
  preferred_debit_day?: number
  min_amount?: number
  max_amount?: number
}

export interface PaymentStats {
  total_payments: number
  total_amount: number
  paid_count: number
  paid_amount: number
  pending_count: number
  pending_amount: number
  rejected_count: number
  rejected_amount: number
  reject_rate: number
  average_amount: number
}

export interface PaymentKPI {
  label: string
  value: string | number
  change?: number // Pourcentage de changement
  trend?: "up" | "down" | "neutral"
  icon?: string
}

// Calendrier de prélèvement
export interface DebitCalendar {
  month: number
  year: number
  days: DebitCalendarDay[]
}

export interface DebitCalendarDay {
  date: string
  day_of_month: number
  lot?: DebitLot
  planned_count: number
  planned_amount: number
  actual_count?: number
  actual_amount?: number
  psp_distribution: Record<PSPProvider, number>
}

// Règles de routage PSP
export interface RoutingRule {
  id: string
  name: string
  priority: number
  company_id?: string
  conditions: RoutingConditions
  target_psp: PSPProvider
  is_enabled: boolean
  is_fallback: boolean
  created_at: string
  updated_at: string
}

export interface RoutingConditions {
  debit_lot_codes?: DebitLot[]
  preferred_debit_days?: number[]
  source_channels?: SourceChannel[]
  risk_tiers?: RiskTier[]
  product_codes?: string[]
  contract_age_months_gte?: number
  amount_gte?: number
  amount_lte?: number
}

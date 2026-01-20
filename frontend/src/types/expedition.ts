/**
 * Types pour les expéditions et la logistique
 */

// ============================================
// Types d'état
// ============================================

export type ExpeditionEtat =
  | "en_attente"
  | "pris_en_charge"
  | "en_transit"
  | "en_livraison"
  | "livre"
  | "echec_livraison"
  | "retourne"

// ============================================
// DTOs (correspondant au backend)
// ============================================

export interface ExpeditionClient {
  id: string
  nom: string
  prenom: string
  entreprise: string | null
  email: string
}

export interface ExpeditionContrat {
  id: string
  referenceExterne: string
}

export interface ExpeditionTransporteur {
  id: string
  type: string
}

export interface ExpeditionDto {
  id: string
  organisationId: string
  referenceCommande: string
  trackingNumber: string
  etat: ExpeditionEtat
  nomProduit: string
  poids: number | null
  villeDestination: string
  codePostalDestination: string
  adresseDestination: string
  dateCreation: string
  dateExpedition: string | null
  dateLivraisonEstimee: string | null
  dateLivraison: string | null
  dateDernierStatut: string | null
  lieuActuel: string | null
  labelUrl: string | null
  client: ExpeditionClient | null
  contrat: ExpeditionContrat | null
  transporteur: ExpeditionTransporteur | null
  createdAt: string
  updatedAt: string
}

// ============================================
// Filtres
// ============================================

export interface ExpeditionsFilters {
  etat?: ExpeditionEtat
  clientId?: string
  contratId?: string
  transporteurId?: string
  dateDebut?: string
  dateFin?: string
}

// ============================================
// Constantes d'affichage
// ============================================

export const EXPEDITION_ETAT_LABELS: Record<ExpeditionEtat, string> = {
  en_attente: "En attente",
  pris_en_charge: "Pris en charge",
  en_transit: "En transit",
  en_livraison: "En cours de livraison",
  livre: "Livré",
  echec_livraison: "Échec de livraison",
  retourne: "Retourné",
}

export const EXPEDITION_ETAT_VARIANTS: Record<ExpeditionEtat, "default" | "secondary" | "destructive" | "outline"> = {
  en_attente: "outline",
  pris_en_charge: "secondary",
  en_transit: "secondary",
  en_livraison: "default",
  livre: "default",
  echec_livraison: "destructive",
  retourne: "destructive",
}

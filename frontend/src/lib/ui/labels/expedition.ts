/**
 * UI labels, variants, and types for expeditions
 */

export type ExpeditionEtat =
  | "en_attente"
  | "pris_en_charge"
  | "en_transit"
  | "en_livraison"
  | "livre"
  | "echec_livraison"
  | "retourne"

export interface ExpeditionsFilters {
  etat?: ExpeditionEtat
  clientId?: string
  contratId?: string
  transporteurId?: string
  dateDebut?: string
  dateFin?: string
}

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

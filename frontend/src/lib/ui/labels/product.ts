/**
 * UI labels, display string types, and filter interfaces for product module.
 * Proto enums (TypeProduit, CategorieProduit) come from @proto/products/products.
 */

import { TypeProduit, CategorieProduit } from "@proto/products/products"

// Display string types for UI rendering
export type ProductType = "Interne" | "Partenaire"
export type ProductStatus = "Disponible" | "Rupture" | "Sur commande" | "Archivé"
export type ProductCategory =
  | "Assistance"
  | "Bleulec"
  | "Bleulec Assur"
  | "Décès toutes causes"
  | "Dépendance"
  | "Garantie des accidents de la vie"
  | "Multirisques habitation"
  | "Obsèque"
  | "Protection juridique"
  | "Santé"

// Label records mapping proto enum values to display strings
export const TYPE_PRODUIT_LABELS: Record<TypeProduit, string> = {
  [TypeProduit.TYPE_PRODUIT_UNSPECIFIED]: "Non spécifié",
  [TypeProduit.INTERNE]: "Interne",
  [TypeProduit.PARTENAIRE]: "Partenaire",
  [TypeProduit.UNRECOGNIZED]: "Non reconnu",
}

export const CATEGORIE_PRODUIT_LABELS: Record<CategorieProduit, string> = {
  [CategorieProduit.CATEGORIE_PRODUIT_UNSPECIFIED]: "Non spécifié",
  [CategorieProduit.ASSURANCE]: "Assurance",
  [CategorieProduit.PREVOYANCE]: "Prévoyance",
  [CategorieProduit.EPARGNE]: "Épargne",
  [CategorieProduit.SERVICE]: "Service",
  [CategorieProduit.ACCESSOIRE]: "Accessoire",
  [CategorieProduit.UNRECOGNIZED]: "Non reconnu",
}

// Filters for product search
export interface ProductFilters {
  search?: string
  type?: ProductType
  category?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  organisationId?: string
  gammeId?: string
}

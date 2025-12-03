export type ProductType = "Interne" | "Partenaire"
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

export type ProductStatus = "Disponible" | "Rupture" | "Sur commande" | "Archivé"

// DTO correspondant au backend
export interface ProduitDto {
  id: string
  societeId: string
  gammeId?: string
  sku: string
  nom: string
  description: string
  categorie?: string
  type: "Interne" | "Partenaire"
  prix: number
  tauxTVA: number
  prixTTC: number
  devise: string
  fournisseur?: string
  actif: boolean
  // Champs promotion
  promotionActive: boolean
  promotionPourcentage?: number
  promotionDateDebut?: string
  promotionDateFin?: string
  prixPromo?: number
  prixPromoTTC?: number
  createdAt: string
  updatedAt: string
}

export interface CreateProduitDto {
  societeId: string
  gammeId?: string
  sku: string
  nom: string
  description: string
  categorie?: string
  type: "Interne" | "Partenaire"
  prix: number
  tauxTVA?: number
  devise?: string
  fournisseur?: string
  actif: boolean
  // Champs promotion
  promotionActive?: boolean
  promotionPourcentage?: number
  promotionDateDebut?: string
  promotionDateFin?: string
}

export interface UpdateProduitDto {
  societeId?: string
  gammeId?: string
  sku?: string
  nom?: string
  description?: string
  categorie?: string
  type?: "Interne" | "Partenaire"
  prix?: number
  tauxTVA?: number
  devise?: string
  fournisseur?: string
  actif?: boolean
  // Champs promotion
  promotionActive?: boolean
  promotionPourcentage?: number
  promotionDateDebut?: string
  promotionDateFin?: string
}

// Type pour l'affichage (compatible avec l'UI existante)
export interface Product {
  id: string
  societeId: string
  gammeId?: string
  name: string
  description: string
  type: ProductType
  category?: string
  status: ProductStatus
  price: number
  taxRate: number
  priceTTC: number
  currency: string
  sku: string
  supplier?: string
  image?: string
  tags?: string[]
  stock?: number
  minQuantity?: number
  actif: boolean
  // Champs promotion
  promotionActive: boolean
  promotionPourcentage?: number
  promotionDateDebut?: string
  promotionDateFin?: string
  prixPromo?: number
  prixPromoTTC?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProductFilters {
  search?: string
  type?: ProductType
  category?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  supplier?: string
  societeId?: string
}

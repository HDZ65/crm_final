// Local copies of enums for client-side use
// These must match the gRPC generated enums
export enum TypeProduit {
  TYPE_UNSPECIFIED = 0,
  INTERNE = 1,
  PARTENAIRE = 2,
}

export enum CategorieProduit {
  CATEGORIE_UNSPECIFIED = 0,
  ASSISTANCE = 1,
  BLEULEC = 2,
  BLEULEC_ASSUR = 3,
  DECES_TOUTES_CAUSES = 4,
  DEPENDANCE = 5,
  GARANTIE_ACCIDENTS_VIE = 6,
  MULTIRISQUES_HABITATION = 7,
  OBSEQUE = 8,
  PROTECTION_JURIDIQUE = 9,
  SANTE = 10,
}

// Type display variants
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

// DTO interface matching gRPC Produit
export interface ProduitDto {
  id: string
  organisationId: string
  gammeId: string
  sku: string
  nom: string
  description: string
  categorie: CategorieProduit
  type: TypeProduit
  prix: number
  tauxTva: number
  devise: string
  actif: boolean
  promotionActive: boolean
  prixPromotion: number
  dateDebutPromotion: string
  dateFinPromotion: string
  imageUrl: string
  codeExterne: string
  metadata: string
  createdAt: string
  updatedAt: string
}

export interface CreateProduitDto {
  organisationId: string
  gammeId: string
  sku: string
  nom: string
  description?: string
  categorie: CategorieProduit
  type: TypeProduit
  prix: number
  tauxTva: number
  devise?: string
  imageUrl?: string
  codeExterne?: string
  metadata?: string
}

export interface UpdateProduitDto {
  id: string
  gammeId?: string
  sku?: string
  nom?: string
  description?: string
  categorie?: CategorieProduit
  type?: TypeProduit
  prix?: number
  tauxTva?: number
  devise?: string
  actif?: boolean
  imageUrl?: string
  codeExterne?: string
  metadata?: string
}

// Type pour l'affichage (compatible avec l'UI existante)
export interface Product {
  id: string
  organisationId: string
  gammeId?: string
  name: string
  description: string
  type: string
  category?: string
  status: ProductStatus
  price: number
  taxRate: number
  priceTTC: number
  currency: string
  sku: string
  actif: boolean
  // Champs promotion
  promotionActive: boolean
  promotionPrice?: number
  promotionDateDebut?: string
  promotionDateFin?: string
  // Champs promotion additionnels pour l'UI
  promotionPourcentage?: number
  prixPromo?: number
  prixPromoTTC?: number
  // Image et métadonnées
  imageUrl?: string
  image?: string
  codeExterne?: string
  // Champs optionnels pour l'UI
  supplier?: string
  tags?: string[]
  stock?: number
  minQuantity?: number
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
  organisationId?: string
  gammeId?: string
}

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

export interface Product {
  id: string
  name: string
  description: string
  type: ProductType
  category: ProductCategory
  status: ProductStatus
  price: number
  currency: string
  sku: string
  supplier?: string // Nom du partenaire si type="Partenaire"
  image?: string
  tags?: string[]
  stock?: number
  minQuantity?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProductFilters {
  search?: string
  type?: ProductType
  category?: ProductCategory
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  supplier?: string
}

import type { Gamme as GrpcGamme } from "@proto/products/products"

// Re-export du type gRPC
export type GammeDto = GrpcGamme

export interface CreateGammeDto {
  organisationId: string
  nom: string
  description?: string
  code?: string
  icone?: string
  ordre?: number
}

export interface UpdateGammeDto {
  id: string
  nom?: string
  description?: string
  code?: string
  icone?: string
  ordre?: number
  actif?: boolean
}

// Type pour l'affichage
export interface Gamme {
  id: string
  organisationId: string
  name: string
  description?: string
  code?: string
  icon?: string
  ordre?: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

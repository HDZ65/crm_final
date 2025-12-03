// DTO correspondant au backend
export interface GammeDto {
  id: string
  societeId: string
  nom: string
  description?: string
  icone?: string
  actif: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGammeDto {
  societeId: string
  nom: string
  description?: string
  icone?: string
  actif: boolean
}

export interface UpdateGammeDto {
  societeId?: string
  nom?: string
  description?: string
  icone?: string
  actif?: boolean
}

// Type pour l'affichage
export interface Gamme {
  id: string
  societeId: string
  name: string
  description?: string
  icon?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

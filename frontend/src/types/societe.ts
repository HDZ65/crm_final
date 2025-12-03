/**
 * Types pour les sociétés et groupes
 */

// Société (depuis le backend)
export interface SocieteDto {
  id: string
  organisationId: string
  raisonSociale: string
  siren: string
  numeroTVA: string
  createdAt: string
  updatedAt: string
}

// Groupe (alias pour compatibilité UI)
export interface Groupe {
  id: string
  nom: string
}

// DTO pour créer une société
export interface CreateSocieteDto {
  organisationId: string
  raisonSociale: string
  siren: string
  numeroTVA: string
}

// DTO pour mettre à jour une société
export interface UpdateSocieteDto {
  raisonSociale?: string
  siren?: string
  numeroTVA?: string
}

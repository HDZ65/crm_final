/**
 * Types pour les Commerciaux
 * Correspond au ApporteurResponseDto du backend
 */

// Type de commercial
export type TypeCommercial = 'vrp' | 'manager' | 'directeur' | 'partenaire'

// Labels pour affichage
export const TYPE_COMMERCIAL_LABELS: Record<TypeCommercial, string> = {
  vrp: 'VRP',
  manager: 'Manager',
  directeur: 'Directeur',
  partenaire: 'Partenaire',
}

/**
 * Commercial - correspond à ApporteurResponseDto du backend
 */
export interface Commercial {
  id: string
  organisationId: string
  utilisateurId?: string | null
  nom: string
  prenom: string
  typeApporteur: TypeCommercial
  email?: string | null
  telephone?: string | null
  actif: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Filtres pour la recherche de commerciaux
 */
export interface CommercialFilters {
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  typeApporteur?: TypeCommercial
  actif?: boolean
  organisationId?: string
}

/**
 * Helper pour obtenir le nom complet d'un commercial
 */
export function getCommercialFullName(commercial: Pick<Commercial, 'nom' | 'prenom'>): string {
  return `${commercial.prenom} ${commercial.nom}`.trim()
}

/**
 * Helper pour obtenir le label du type de commercial
 */
export function getTypeCommercialLabel(type: TypeCommercial): string {
  return TYPE_COMMERCIAL_LABELS[type] || type
}

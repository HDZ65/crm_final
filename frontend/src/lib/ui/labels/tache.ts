/**
 * UI labels, colors, string literal types, filter interfaces for taches
 */

import type { Tache } from "@proto/activites/activites";

export type TacheType =
  | 'APPEL'
  | 'EMAIL'
  | 'RDV'
  | 'RELANCE_IMPAYE'
  | 'RELANCE_CONTRAT'
  | 'RENOUVELLEMENT'
  | 'SUIVI'
  | 'AUTRE';

export type TachePriorite = 'HAUTE' | 'MOYENNE' | 'BASSE';

export type TacheStatut = 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface TacheFilters {
  organisationId?: string;
  assigneA?: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  statut?: TacheStatut;
  type?: TacheType;
  enRetard?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTachesDto {
  data: Tache[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Labels pour l'affichage
export const TACHE_TYPE_LABELS: Record<TacheType, string> = {
  APPEL: 'Appel',
  EMAIL: 'Email',
  RDV: 'Rendez-vous',
  RELANCE_IMPAYE: 'Relance impayé',
  RELANCE_CONTRAT: 'Relance contrat',
  RENOUVELLEMENT: 'Renouvellement',
  SUIVI: 'Suivi',
  AUTRE: 'Autre',
};

export const TACHE_PRIORITE_LABELS: Record<TachePriorite, string> = {
  HAUTE: 'Haute',
  MOYENNE: 'Moyenne',
  BASSE: 'Basse',
};

export const TACHE_STATUT_LABELS: Record<TacheStatut, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

// Couleurs pour les badges
export const TACHE_PRIORITE_COLORS: Record<TachePriorite, string> = {
  HAUTE: 'destructive',
  MOYENNE: 'default',
  BASSE: 'secondary',
};

export const TACHE_STATUT_COLORS: Record<TacheStatut, string> = {
  A_FAIRE: 'outline',
  EN_COURS: 'default',
  TERMINEE: 'success',
  ANNULEE: 'secondary',
};

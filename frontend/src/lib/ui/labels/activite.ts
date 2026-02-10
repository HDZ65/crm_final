/**
 * UI labels, icons, colors, filter interfaces, and pagination types for activites
 */

import type { Activite, EvenementSuivi } from "@proto/activites/activites";

export interface ActiviteFilters {
  search?: string;
  typeId?: string;
  clientBaseId?: string;
  contratId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedActivitesDto {
  data: Activite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EvenementSuiviFilters {
  expeditionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEvenementsSuiviDto {
  data: EvenementSuivi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TYPE_ACTIVITE_CODES = {
  APPEL: "APPEL",
  EMAIL: "EMAIL",
  REUNION: "REUNION",
  VISITE: "VISITE",
  NOTE: "NOTE",
  AUTRE: "AUTRE",
} as const;

export type TypeActiviteCode = keyof typeof TYPE_ACTIVITE_CODES;

export const TYPE_ACTIVITE_LABELS: Record<string, string> = {
  APPEL: "Appel téléphonique",
  EMAIL: "Email",
  REUNION: "Réunion",
  VISITE: "Visite",
  NOTE: "Note",
  AUTRE: "Autre",
};

export const TYPE_ACTIVITE_ICONS: Record<string, string> = {
  APPEL: "phone",
  EMAIL: "mail",
  REUNION: "users",
  VISITE: "map-pin",
  NOTE: "file-text",
  AUTRE: "circle",
};

export const EVENEMENT_SUIVI_CODES = {
  PRISE_EN_CHARGE: "PRISE_EN_CHARGE",
  EN_TRANSIT: "EN_TRANSIT",
  EN_LIVRAISON: "EN_LIVRAISON",
  LIVRE: "LIVRE",
  ECHEC_LIVRAISON: "ECHEC_LIVRAISON",
  RETOUR: "RETOUR",
} as const;

export type EvenementSuiviCode = keyof typeof EVENEMENT_SUIVI_CODES;

export const EVENEMENT_SUIVI_LABELS: Record<string, string> = {
  PRISE_EN_CHARGE: "Prise en charge",
  EN_TRANSIT: "En transit",
  EN_LIVRAISON: "En cours de livraison",
  LIVRE: "Livré",
  ECHEC_LIVRAISON: "Échec de livraison",
  RETOUR: "Retour",
};

export const EVENEMENT_SUIVI_COLORS: Record<string, string> = {
  PRISE_EN_CHARGE: "default",
  EN_TRANSIT: "default",
  EN_LIVRAISON: "warning",
  LIVRE: "success",
  ECHEC_LIVRAISON: "destructive",
  RETOUR: "secondary",
};

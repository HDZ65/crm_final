export interface TypeActiviteDto {
  id: string;
  code: string;
  nom: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiviteDto {
  id: string;
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire?: string;
  echeance?: string;
  clientBaseId?: string;
  contratId?: string;
  clientPartenaireId?: string;
  createdAt: string;
  updatedAt: string;
  type?: TypeActiviteDto;
}

export interface CreateActiviteDto {
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire?: string;
  echeance?: string;
  clientBaseId?: string;
  contratId?: string;
  clientPartenaireId?: string;
}

export interface UpdateActiviteDto {
  typeId?: string;
  dateActivite?: string;
  sujet?: string;
  commentaire?: string;
  echeance?: string;
}

export interface ActiviteFilters {
  search?: string;
  typeId?: string;
  clientBaseId?: string;
  contratId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedActivitesDto {
  data: ActiviteDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EvenementSuiviDto {
  id: string;
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu?: string;
  raw?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvenementSuiviDto {
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu?: string;
  raw?: string;
}

export interface UpdateEvenementSuiviDto {
  code?: string;
  label?: string;
  dateEvenement?: string;
  lieu?: string;
  raw?: string;
}

export interface EvenementSuiviFilters {
  expeditionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEvenementsSuiviDto {
  data: EvenementSuiviDto[];
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

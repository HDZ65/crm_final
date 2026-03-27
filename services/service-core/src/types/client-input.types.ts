/**
 * Types stricts pour les inputs clients.
 * Résout le problème de mapping snake_case (proto) <-> camelCase (entité).
 */
import type { FindOptionsWhere } from 'typeorm';
import type { ClientBaseEntity } from '../domain/clients/entities';

/**
 * Input normalisé pour la création d'un client.
 * Accepte les deux formats (proto snake_case et legacy camelCase).
 */
export interface CreateClientInput {
  // Required fields
  organisation_id: string;
  type_client: string;
  nom: string;
  prenom: string;
  telephone: string;

  // Optional fields (snake_case from proto)
  date_naissance?: string;
  compte_code?: string;
  partenaire_id?: string;
  email?: string;
  statut?: string;
  source?: string;
  canal_acquisition?: string;
  civilite?: string;
  iban?: string;
  bic?: string;
  mandat_sepa?: boolean;
  csp?: string;
  regime_social?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  etape_courante?: string;
  is_politically_exposed?: boolean;
  numss?: string;
}

/**
 * Input normalisé pour la mise à jour d'un client.
 */
export interface UpdateClientInput {
  id: string;
  type_client?: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  compte_code?: string;
  partenaire_id?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  source?: string;
  canal_acquisition?: string;
  civilite?: string;
  iban?: string;
  bic?: string;
  mandat_sepa?: boolean;
  csp?: string;
  regime_social?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  etape_courante?: string;
  is_politically_exposed?: boolean;
  numss?: string;
}

/**
 * Input normalisé pour la liste des clients.
 */
export interface ListClientsInput {
  organisation_id: string;
  statut_id?: string;
  source?: string;
  search?: string;
  pagination?: PaginationInput;
}

/**
 * Input de pagination normalisé.
 */
export interface PaginationInput {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

/**
 * Réponse paginée standard.
 */
export interface PaginationOutput {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Critères de recherche pour findOne avec typage strict.
 */
export type ClientBaseFindCriteria = FindOptionsWhere<ClientBaseEntity>;

/**
 * Helper pour normaliser les inputs proto vers le format attendu.
 * Supporte le mapping snake_case -> camelCase pour les champs d'entité.
 */
export function normalizeClientCreateInput(input: CreateClientInput): {
  keycloakGroupId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: Date | null;
  compteCode: string;
  partenaireId: string;
  email: string | null;
  statut: string;
  source: string | null;
  canalAcquisition: string | null;
  civilite: string | null;
  iban: string | null;
  bic: string | null;
  mandatSepa: boolean | null;
  csp: string | null;
  regimeSocial: string | null;
  lieuNaissance: string | null;
  paysNaissance: string | null;
  etapeCourante: string | null;
  isPoliticallyExposed: boolean | null;
  numss: string | null;
} {
  return {
    keycloakGroupId: input.organisation_id,
    typeClient: input.type_client,
    nom: input.nom,
    prenom: input.prenom,
    telephone: input.telephone,
    dateNaissance: input.date_naissance ? new Date(input.date_naissance) : null,
    compteCode: input.compte_code ?? '',
    partenaireId: input.partenaire_id ?? '',
    email: input.email ?? null,
    statut: input.statut ?? 'ACTIF',
    source: input.source ?? null,
    canalAcquisition: input.canal_acquisition ?? null,
    civilite: input.civilite ?? null,
    iban: input.iban ?? null,
    bic: input.bic ?? null,
    mandatSepa: input.mandat_sepa ?? null,
    csp: input.csp ?? null,
    regimeSocial: input.regime_social ?? null,
    lieuNaissance: input.lieu_naissance ?? null,
    paysNaissance: input.pays_naissance ?? null,
    etapeCourante: input.etape_courante ?? null,
    isPoliticallyExposed: input.is_politically_exposed ?? null,
    numss: input.numss ?? null,
  };
}

/**
 * Helper pour extraire les paramètres de pagination depuis un input proto.
 */
export function normalizePagination(pagination?: PaginationInput): {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
} {
  return {
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 20,
    sortBy: pagination?.sort_by ?? 'createdAt',
    sortOrder: (pagination?.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
  };
}

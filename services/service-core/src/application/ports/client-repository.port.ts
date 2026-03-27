/**
 * Port for client repository operations
 */
export interface ClientQueryResult {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  organisationId: string;
  statutId: string;
  createdAt: Date;
}

export interface ClientFilters {
  organisationId?: string;
  statutId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface IClientRepositoryPort {
  findById(id: string): Promise<ClientQueryResult | null>;
  findMany(filters: ClientFilters): Promise<ClientQueryResult[]>;
  count(filters: ClientFilters): Promise<number>;
}

export const CLIENT_REPOSITORY_PORT = Symbol('IClientRepositoryPort');

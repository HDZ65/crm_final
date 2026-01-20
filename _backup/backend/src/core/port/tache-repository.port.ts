import { TacheEntity, TacheStatut, TacheType } from '../domain/tache.entity';
import { BaseRepositoryPort } from './repository.port';

export interface TacheQueryOptions {
  organisationId?: string;
  assigneA?: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  statut?: TacheStatut;
  type?: TacheType;
  enRetard?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TacheRepositoryPort extends BaseRepositoryPort<TacheEntity> {
  findByOrganisationId(organisationId: string): Promise<TacheEntity[]>;
  findByAssigneA(assigneA: string): Promise<TacheEntity[]>;
  findByClientId(clientId: string): Promise<TacheEntity[]>;
  findByContratId(contratId: string): Promise<TacheEntity[]>;
  findByFactureId(factureId: string): Promise<TacheEntity[]>;
  findByStatut(
    organisationId: string,
    statut: TacheStatut,
  ): Promise<TacheEntity[]>;
  findByType(organisationId: string, type: TacheType): Promise<TacheEntity[]>;
  findEnRetard(organisationId: string): Promise<TacheEntity[]>;
  findEcheanceDemain(organisationId: string): Promise<TacheEntity[]>;
  findMesEnRetard(assigneA: string): Promise<TacheEntity[]>;
  findMesEcheanceDemain(assigneA: string): Promise<TacheEntity[]>;
  findDuJour(assigneA: string): Promise<TacheEntity[]>;
  findASemaine(assigneA: string): Promise<TacheEntity[]>;
  countByStatut(organisationId: string): Promise<Record<TacheStatut, number>>;
  countEnRetard(organisationId: string): Promise<number>;
  findByRegleRelanceId(regleRelanceId: string): Promise<TacheEntity[]>;
  findPaginated(
    options: TacheQueryOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<TacheEntity>>;
  search(
    organisationId: string,
    searchTerm: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TacheEntity>>;
}

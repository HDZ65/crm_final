import { TacheEntity, TacheStatut, TacheType } from '../domain/tache.entity';
import { BaseRepositoryPort } from './repository.port';

export interface TacheRepositoryPort extends BaseRepositoryPort<TacheEntity> {
  findByOrganisationId(organisationId: string): Promise<TacheEntity[]>;
  findByAssigneA(assigneA: string): Promise<TacheEntity[]>;
  findByClientId(clientId: string): Promise<TacheEntity[]>;
  findByContratId(contratId: string): Promise<TacheEntity[]>;
  findByFactureId(factureId: string): Promise<TacheEntity[]>;
  findByStatut(organisationId: string, statut: TacheStatut): Promise<TacheEntity[]>;
  findByType(organisationId: string, type: TacheType): Promise<TacheEntity[]>;
  findEnRetard(organisationId: string): Promise<TacheEntity[]>;
  findDuJour(assigneA: string): Promise<TacheEntity[]>;
  findASemaine(assigneA: string): Promise<TacheEntity[]>;
  countByStatut(organisationId: string): Promise<Record<TacheStatut, number>>;
  countEnRetard(organisationId: string): Promise<number>;
  findByRegleRelanceId(regleRelanceId: string): Promise<TacheEntity[]>;
}

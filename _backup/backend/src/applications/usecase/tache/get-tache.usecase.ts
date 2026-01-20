import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  TacheEntity,
  TacheStatut,
  TacheType,
} from '../../../core/domain/tache.entity';
import type {
  TacheRepositoryPort,
  TacheQueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../core/port/tache-repository.port';

@Injectable()
export class GetTacheUseCase {
  constructor(
    @Inject('TacheRepositoryPort')
    private readonly repository: TacheRepositoryPort,
  ) {}

  async execute(id: string): Promise<TacheEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Tâche avec l'id ${id} non trouvée`);
    }
    return entity;
  }

  async executeAll(): Promise<TacheEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<TacheEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeByAssigneA(assigneA: string): Promise<TacheEntity[]> {
    return await this.repository.findByAssigneA(assigneA);
  }

  async executeByClientId(clientId: string): Promise<TacheEntity[]> {
    return await this.repository.findByClientId(clientId);
  }

  async executeByContratId(contratId: string): Promise<TacheEntity[]> {
    return await this.repository.findByContratId(contratId);
  }

  async executeByFactureId(factureId: string): Promise<TacheEntity[]> {
    return await this.repository.findByFactureId(factureId);
  }

  async executeByStatut(
    organisationId: string,
    statut: TacheStatut,
  ): Promise<TacheEntity[]> {
    return await this.repository.findByStatut(organisationId, statut);
  }

  async executeByType(
    organisationId: string,
    type: TacheType,
  ): Promise<TacheEntity[]> {
    return await this.repository.findByType(organisationId, type);
  }

  async executeEnRetard(organisationId: string): Promise<TacheEntity[]> {
    return await this.repository.findEnRetard(organisationId);
  }

  async executeEcheanceDemain(organisationId: string): Promise<TacheEntity[]> {
    return await this.repository.findEcheanceDemain(organisationId);
  }

  async executeMesEnRetard(assigneA: string): Promise<TacheEntity[]> {
    return await this.repository.findMesEnRetard(assigneA);
  }

  async executeMesEcheanceDemain(assigneA: string): Promise<TacheEntity[]> {
    return await this.repository.findMesEcheanceDemain(assigneA);
  }

  async executeDuJour(assigneA: string): Promise<TacheEntity[]> {
    return await this.repository.findDuJour(assigneA);
  }

  async executeASemaine(assigneA: string): Promise<TacheEntity[]> {
    return await this.repository.findASemaine(assigneA);
  }

  async executeCountByStatut(
    organisationId: string,
  ): Promise<Record<TacheStatut, number>> {
    return await this.repository.countByStatut(organisationId);
  }

  async executeCountEnRetard(organisationId: string): Promise<number> {
    return await this.repository.countEnRetard(organisationId);
  }

  async executePaginated(
    options: TacheQueryOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<TacheEntity>> {
    return await this.repository.findPaginated(options, pagination);
  }

  async executeSearch(
    organisationId: string,
    searchTerm: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TacheEntity>> {
    return await this.repository.search(organisationId, searchTerm, pagination);
  }
}

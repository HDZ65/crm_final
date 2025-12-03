import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { HistoriqueRelanceEntity } from '../../../core/domain/historique-relance.entity';
import type { HistoriqueRelanceRepositoryPort } from '../../../core/port/historique-relance-repository.port';

@Injectable()
export class GetHistoriqueRelanceUseCase {
  constructor(
    @Inject('HistoriqueRelanceRepositoryPort')
    private readonly repository: HistoriqueRelanceRepositoryPort,
  ) {}

  async execute(id: string): Promise<HistoriqueRelanceEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Historique de relance avec l'id ${id} non trouvé`);
    }
    return entity;
  }

  async executeAll(): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(organisationId: string): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeByRegleRelanceId(regleRelanceId: string): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findByRegleRelanceId(regleRelanceId);
  }

  async executeByClientId(clientId: string): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findByClientId(clientId);
  }

  async executeByContratId(contratId: string): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findByContratId(contratId);
  }

  async executeByFactureId(factureId: string): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findByFactureId(factureId);
  }

  async executeRecent(organisationId: string, limit: number = 50): Promise<HistoriqueRelanceEntity[]> {
    return await this.repository.findRecent(organisationId, limit);
  }

  async existsForToday(
    regleRelanceId: string,
    clientId?: string,
    contratId?: string,
    factureId?: string,
  ): Promise<boolean> {
    return await this.repository.existsForToday(regleRelanceId, clientId, contratId, factureId);
  }
}

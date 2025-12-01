import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { HistoriqueStatutContratEntity } from '../../../core/domain/historique-statut-contrat.entity';
import type { HistoriqueStatutContratRepositoryPort } from '../../../core/port/historique-statut-contrat-repository.port';

@Injectable()
export class GetHistoriqueStatutContratUseCase {
  constructor(
    @Inject('HistoriqueStatutContratRepositoryPort')
    private readonly repository: HistoriqueStatutContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<HistoriqueStatutContratEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'HistoriqueStatutContrat with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<HistoriqueStatutContratEntity[]> {
    return await this.repository.findAll();
  }
}

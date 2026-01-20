import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutContratEntity } from '../../../core/domain/statut-contrat.entity';
import type { StatutContratRepositoryPort } from '../../../core/port/statut-contrat-repository.port';

@Injectable()
export class GetStatutContratUseCase {
  constructor(
    @Inject('StatutContratRepositoryPort')
    private readonly repository: StatutContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<StatutContratEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('StatutContrat with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<StatutContratEntity[]> {
    return await this.repository.findAll();
  }
}

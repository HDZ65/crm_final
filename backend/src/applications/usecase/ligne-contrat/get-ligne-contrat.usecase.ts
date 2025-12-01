import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LigneContratEntity } from '../../../core/domain/ligne-contrat.entity';
import type { LigneContratRepositoryPort } from '../../../core/port/ligne-contrat-repository.port';

@Injectable()
export class GetLigneContratUseCase {
  constructor(
    @Inject('LigneContratRepositoryPort')
    private readonly repository: LigneContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<LigneContratEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('LigneContrat with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<LigneContratEntity[]> {
    return await this.repository.findAll();
  }
}

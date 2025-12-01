import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutFactureEntity } from '../../../core/domain/statut-facture.entity';
import type { StatutFactureRepositoryPort } from '../../../core/port/statut-facture-repository.port';

@Injectable()
export class GetStatutFactureUseCase {
  constructor(
    @Inject('StatutFactureRepositoryPort')
    private readonly repository: StatutFactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<StatutFactureEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('StatutFacture with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<StatutFactureEntity[]> {
    return await this.repository.findAll();
  }
}

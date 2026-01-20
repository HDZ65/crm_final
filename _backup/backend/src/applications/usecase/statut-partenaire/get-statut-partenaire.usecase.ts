import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutPartenaireEntity } from '../../../core/domain/statut-partenaire.entity';
import type { StatutPartenaireRepositoryPort } from '../../../core/port/statut-partenaire-repository.port';

@Injectable()
export class GetStatutPartenaireUseCase {
  constructor(
    @Inject('StatutPartenaireRepositoryPort')
    private readonly repository: StatutPartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<StatutPartenaireEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'StatutPartenaire with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<StatutPartenaireEntity[]> {
    return await this.repository.findAll();
  }
}

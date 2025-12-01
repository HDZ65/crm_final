import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PartenaireMarqueBlancheEntity } from '../../../core/domain/partenaire-marque-blanche.entity';
import type { PartenaireMarqueBlancheRepositoryPort } from '../../../core/port/partenaire-marque-blanche-repository.port';

@Injectable()
export class GetPartenaireMarqueBlancheUseCase {
  constructor(
    @Inject('PartenaireMarqueBlancheRepositoryPort')
    private readonly repository: PartenaireMarqueBlancheRepositoryPort,
  ) {}

  async execute(id: string): Promise<PartenaireMarqueBlancheEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'PartenaireMarqueBlanche with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<PartenaireMarqueBlancheEntity[]> {
    return await this.repository.findAll();
  }
}

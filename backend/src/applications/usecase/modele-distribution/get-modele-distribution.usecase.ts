import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ModeleDistributionEntity } from '../../../core/domain/modele-distribution.entity';
import type { ModeleDistributionRepositoryPort } from '../../../core/port/modele-distribution-repository.port';

@Injectable()
export class GetModeleDistributionUseCase {
  constructor(
    @Inject('ModeleDistributionRepositoryPort')
    private readonly repository: ModeleDistributionRepositoryPort,
  ) {}

  async execute(id: string): Promise<ModeleDistributionEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'ModeleDistribution with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<ModeleDistributionEntity[]> {
    return await this.repository.findAll();
  }
}

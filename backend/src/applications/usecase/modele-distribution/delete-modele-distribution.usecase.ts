import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ModeleDistributionRepositoryPort } from '../../../core/port/modele-distribution-repository.port';

@Injectable()
export class DeleteModeleDistributionUseCase {
  constructor(
    @Inject('ModeleDistributionRepositoryPort')
    private readonly repository: ModeleDistributionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ModeleDistribution with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

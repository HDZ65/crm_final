import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ModeleDistributionEntity } from '../../../core/domain/modele-distribution.entity';
import type { ModeleDistributionRepositoryPort } from '../../../core/port/modele-distribution-repository.port';
import { UpdateModeleDistributionDto } from '../../dto/modele-distribution/update-modele-distribution.dto';

@Injectable()
export class UpdateModeleDistributionUseCase {
  constructor(
    @Inject('ModeleDistributionRepositoryPort')
    private readonly repository: ModeleDistributionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateModeleDistributionDto,
  ): Promise<ModeleDistributionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ModeleDistribution with id ' + id + ' not found',
      );
    }

    if (dto.code !== undefined) {
      existing.code = dto.code;
    }
    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

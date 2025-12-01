import { Injectable, Inject } from '@nestjs/common';
import { ModeleDistributionEntity } from '../../../core/domain/modele-distribution.entity';
import type { ModeleDistributionRepositoryPort } from '../../../core/port/modele-distribution-repository.port';
import { CreateModeleDistributionDto } from '../../dto/modele-distribution/create-modele-distribution.dto';

@Injectable()
export class CreateModeleDistributionUseCase {
  constructor(
    @Inject('ModeleDistributionRepositoryPort')
    private readonly repository: ModeleDistributionRepositoryPort,
  ) {}

  async execute(
    dto: CreateModeleDistributionDto,
  ): Promise<ModeleDistributionEntity> {
    const entity = new ModeleDistributionEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

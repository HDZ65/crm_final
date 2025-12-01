import { Injectable, Inject } from '@nestjs/common';
import { EmissionFactureEntity } from '../../../core/domain/emission-facture.entity';
import type { EmissionFactureRepositoryPort } from '../../../core/port/emission-facture-repository.port';
import { CreateEmissionFactureDto } from '../../dto/emission-facture/create-emission-facture.dto';

@Injectable()
export class CreateEmissionFactureUseCase {
  constructor(
    @Inject('EmissionFactureRepositoryPort')
    private readonly repository: EmissionFactureRepositoryPort,
  ) {}

  async execute(dto: CreateEmissionFactureDto): Promise<EmissionFactureEntity> {
    const entity = new EmissionFactureEntity({
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

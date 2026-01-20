import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EmissionFactureEntity } from '../../../core/domain/emission-facture.entity';
import type { EmissionFactureRepositoryPort } from '../../../core/port/emission-facture-repository.port';
import { UpdateEmissionFactureDto } from '../../dto/emission-facture/update-emission-facture.dto';

@Injectable()
export class UpdateEmissionFactureUseCase {
  constructor(
    @Inject('EmissionFactureRepositoryPort')
    private readonly repository: EmissionFactureRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateEmissionFactureDto,
  ): Promise<EmissionFactureEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'EmissionFacture with id ' + id + ' not found',
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

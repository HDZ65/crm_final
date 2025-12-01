import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutFactureEntity } from '../../../core/domain/statut-facture.entity';
import type { StatutFactureRepositoryPort } from '../../../core/port/statut-facture-repository.port';
import { UpdateStatutFactureDto } from '../../dto/statut-facture/update-statut-facture.dto';

@Injectable()
export class UpdateStatutFactureUseCase {
  constructor(
    @Inject('StatutFactureRepositoryPort')
    private readonly repository: StatutFactureRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateStatutFactureDto,
  ): Promise<StatutFactureEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('StatutFacture with id ' + id + ' not found');
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
    if (dto.ordreAffichage !== undefined) {
      existing.ordreAffichage = dto.ordreAffichage;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

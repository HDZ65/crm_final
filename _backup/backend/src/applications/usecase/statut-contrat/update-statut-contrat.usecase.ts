import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutContratEntity } from '../../../core/domain/statut-contrat.entity';
import type { StatutContratRepositoryPort } from '../../../core/port/statut-contrat-repository.port';
import { UpdateStatutContratDto } from '../../dto/statut-contrat/update-statut-contrat.dto';

@Injectable()
export class UpdateStatutContratUseCase {
  constructor(
    @Inject('StatutContratRepositoryPort')
    private readonly repository: StatutContratRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateStatutContratDto,
  ): Promise<StatutContratEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('StatutContrat with id ' + id + ' not found');
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

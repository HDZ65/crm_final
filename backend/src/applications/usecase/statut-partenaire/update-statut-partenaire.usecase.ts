import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutPartenaireEntity } from '../../../core/domain/statut-partenaire.entity';
import type { StatutPartenaireRepositoryPort } from '../../../core/port/statut-partenaire-repository.port';
import { UpdateStatutPartenaireDto } from '../../dto/statut-partenaire/update-statut-partenaire.dto';

@Injectable()
export class UpdateStatutPartenaireUseCase {
  constructor(
    @Inject('StatutPartenaireRepositoryPort')
    private readonly repository: StatutPartenaireRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateStatutPartenaireDto,
  ): Promise<StatutPartenaireEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'StatutPartenaire with id ' + id + ' not found',
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
    if (dto.ordreAffichage !== undefined) {
      existing.ordreAffichage = dto.ordreAffichage;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutClientEntity } from '../../../core/domain/statut-client.entity';
import type { StatutClientRepositoryPort } from '../../../core/port/statut-client-repository.port';
import { UpdateStatutClientDto } from '../../dto/statut-client/update-statut-client.dto';

@Injectable()
export class UpdateStatutClientUseCase {
  constructor(
    @Inject('StatutClientRepositoryPort')
    private readonly repository: StatutClientRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateStatutClientDto,
  ): Promise<StatutClientEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('StatutClient with id ' + id + ' not found');
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

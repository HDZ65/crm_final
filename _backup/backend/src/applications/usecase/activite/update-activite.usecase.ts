import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ActiviteEntity } from '../../../core/domain/activite.entity';
import type { ActiviteRepositoryPort } from '../../../core/port/activite-repository.port';
import { UpdateActiviteDto } from '../../dto/activite/update-activite.dto';

@Injectable()
export class UpdateActiviteUseCase {
  constructor(
    @Inject('ActiviteRepositoryPort')
    private readonly repository: ActiviteRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateActiviteDto): Promise<ActiviteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Activite with id ' + id + ' not found');
    }

    if (dto.typeId !== undefined) {
      existing.typeId = dto.typeId;
    }
    if (dto.dateActivite !== undefined) {
      existing.dateActivite = dto.dateActivite;
    }
    if (dto.sujet !== undefined) {
      existing.sujet = dto.sujet;
    }
    if (dto.commentaire !== undefined) {
      existing.commentaire = dto.commentaire;
    }
    if (dto.echeance !== undefined) {
      existing.echeance = dto.echeance;
    }
    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    if (dto.contratId !== undefined) {
      existing.contratId = dto.contratId;
    }
    if (dto.clientPartenaireId !== undefined) {
      existing.clientPartenaireId = dto.clientPartenaireId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

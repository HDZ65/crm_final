import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GroupeEntity } from '../../../core/domain/groupe.entity';
import type { GroupeRepositoryPort } from '../../../core/port/groupe-repository.port';
import { UpdateGroupeDto } from '../../dto/groupe/update-groupe.dto';

@Injectable()
export class UpdateGroupeUseCase {
  constructor(
    @Inject('GroupeRepositoryPort')
    private readonly repository: GroupeRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateGroupeDto): Promise<GroupeEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Groupe with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    if (dto.type !== undefined) {
      existing.type = dto.type;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

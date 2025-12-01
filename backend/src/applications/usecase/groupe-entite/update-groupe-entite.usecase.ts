import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GroupeEntiteEntity } from '../../../core/domain/groupe-entite.entity';
import type { GroupeEntiteRepositoryPort } from '../../../core/port/groupe-entite-repository.port';
import { UpdateGroupeEntiteDto } from '../../dto/groupe-entite/update-groupe-entite.dto';

@Injectable()
export class UpdateGroupeEntiteUseCase {
  constructor(
    @Inject('GroupeEntiteRepositoryPort')
    private readonly repository: GroupeEntiteRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateGroupeEntiteDto,
  ): Promise<GroupeEntiteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('GroupeEntite with id ' + id + ' not found');
    }

    if (dto.groupeId !== undefined) {
      existing.groupeId = dto.groupeId;
    }
    if (dto.entiteId !== undefined) {
      existing.entiteId = dto.entiteId;
    }
    if (dto.type !== undefined) {
      existing.type = dto.type;
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}

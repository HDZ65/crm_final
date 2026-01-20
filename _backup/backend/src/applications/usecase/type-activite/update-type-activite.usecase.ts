import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TypeActiviteEntity } from '../../../core/domain/type-activite.entity';
import type { TypeActiviteRepositoryPort } from '../../../core/port/type-activite-repository.port';
import { UpdateTypeActiviteDto } from '../../dto/type-activite/update-type-activite.dto';

@Injectable()
export class UpdateTypeActiviteUseCase {
  constructor(
    @Inject('TypeActiviteRepositoryPort')
    private readonly repository: TypeActiviteRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateTypeActiviteDto,
  ): Promise<TypeActiviteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('TypeActivite with id ' + id + ' not found');
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

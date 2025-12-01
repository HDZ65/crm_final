import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RolePartenaireEntity } from '../../../core/domain/role-partenaire.entity';
import type { RolePartenaireRepositoryPort } from '../../../core/port/role-partenaire-repository.port';
import { UpdateRolePartenaireDto } from '../../dto/role-partenaire/update-role-partenaire.dto';

@Injectable()
export class UpdateRolePartenaireUseCase {
  constructor(
    @Inject('RolePartenaireRepositoryPort')
    private readonly repository: RolePartenaireRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateRolePartenaireDto,
  ): Promise<RolePartenaireEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'RolePartenaire with id ' + id + ' not found',
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

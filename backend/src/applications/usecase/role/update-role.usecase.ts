import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RoleEntity } from '../../../core/domain/role.entity';
import type { RoleRepositoryPort } from '../../../core/port/role-repository.port';
import { UpdateRoleDto } from '../../dto/role/update-role.dto';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryPort')
    private readonly repository: RoleRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateRoleDto): Promise<RoleEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Role with id ' + id + ' not found');
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

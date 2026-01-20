import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RolePermissionEntity } from '../../../core/domain/role-permission.entity';
import type { RolePermissionRepositoryPort } from '../../../core/port/role-permission-repository.port';
import { UpdateRolePermissionDto } from '../../dto/role-permission/update-role-permission.dto';

@Injectable()
export class UpdateRolePermissionUseCase {
  constructor(
    @Inject('RolePermissionRepositoryPort')
    private readonly repository: RolePermissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateRolePermissionDto,
  ): Promise<RolePermissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'RolePermission with id ' + id + ' not found',
      );
    }

    if (dto.roleId !== undefined) {
      existing.roleId = dto.roleId;
    }
    if (dto.permissionId !== undefined) {
      existing.permissionId = dto.permissionId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

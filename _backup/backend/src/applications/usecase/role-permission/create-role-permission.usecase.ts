import { Injectable, Inject } from '@nestjs/common';
import { RolePermissionEntity } from '../../../core/domain/role-permission.entity';
import type { RolePermissionRepositoryPort } from '../../../core/port/role-permission-repository.port';
import { CreateRolePermissionDto } from '../../dto/role-permission/create-role-permission.dto';

@Injectable()
export class CreateRolePermissionUseCase {
  constructor(
    @Inject('RolePermissionRepositoryPort')
    private readonly repository: RolePermissionRepositoryPort,
  ) {}

  async execute(dto: CreateRolePermissionDto): Promise<RolePermissionEntity> {
    const entity = new RolePermissionEntity({
      roleId: dto.roleId,
      permissionId: dto.permissionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

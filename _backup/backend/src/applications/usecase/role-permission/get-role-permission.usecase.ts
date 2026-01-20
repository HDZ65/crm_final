import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RolePermissionEntity } from '../../../core/domain/role-permission.entity';
import type { RolePermissionRepositoryPort } from '../../../core/port/role-permission-repository.port';

@Injectable()
export class GetRolePermissionUseCase {
  constructor(
    @Inject('RolePermissionRepositoryPort')
    private readonly repository: RolePermissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<RolePermissionEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'RolePermission with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<RolePermissionEntity[]> {
    return await this.repository.findAll();
  }
}

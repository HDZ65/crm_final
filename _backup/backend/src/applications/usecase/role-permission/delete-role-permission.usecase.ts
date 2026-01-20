import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { RolePermissionRepositoryPort } from '../../../core/port/role-permission-repository.port';

@Injectable()
export class DeleteRolePermissionUseCase {
  constructor(
    @Inject('RolePermissionRepositoryPort')
    private readonly repository: RolePermissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'RolePermission with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

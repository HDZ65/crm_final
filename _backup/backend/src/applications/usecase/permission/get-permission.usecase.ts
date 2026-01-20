import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PermissionEntity } from '../../../core/domain/permission.entity';
import type { PermissionRepositoryPort } from '../../../core/port/permission-repository.port';

@Injectable()
export class GetPermissionUseCase {
  constructor(
    @Inject('PermissionRepositoryPort')
    private readonly repository: PermissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<PermissionEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Permission with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<PermissionEntity[]> {
    return await this.repository.findAll();
  }
}

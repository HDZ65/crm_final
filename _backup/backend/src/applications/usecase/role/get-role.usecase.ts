import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RoleEntity } from '../../../core/domain/role.entity';
import type { RoleRepositoryPort } from '../../../core/port/role-repository.port';

@Injectable()
export class GetRoleUseCase {
  constructor(
    @Inject('RoleRepositoryPort')
    private readonly repository: RoleRepositoryPort,
  ) {}

  async execute(id: string): Promise<RoleEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Role with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<RoleEntity[]> {
    return await this.repository.findAll();
  }
}

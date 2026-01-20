import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { RoleRepositoryPort } from '../../../core/port/role-repository.port';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject('RoleRepositoryPort')
    private readonly repository: RoleRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Role with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

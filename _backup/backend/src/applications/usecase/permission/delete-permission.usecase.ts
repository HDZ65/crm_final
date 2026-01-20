import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PermissionRepositoryPort } from '../../../core/port/permission-repository.port';

@Injectable()
export class DeletePermissionUseCase {
  constructor(
    @Inject('PermissionRepositoryPort')
    private readonly repository: PermissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Permission with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

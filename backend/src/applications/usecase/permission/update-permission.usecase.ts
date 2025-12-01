import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PermissionEntity } from '../../../core/domain/permission.entity';
import type { PermissionRepositoryPort } from '../../../core/port/permission-repository.port';
import { UpdatePermissionDto } from '../../dto/permission/update-permission.dto';

@Injectable()
export class UpdatePermissionUseCase {
  constructor(
    @Inject('PermissionRepositoryPort')
    private readonly repository: PermissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePermissionDto,
  ): Promise<PermissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Permission with id ' + id + ' not found');
    }

    if (dto.code !== undefined) {
      existing.code = dto.code;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

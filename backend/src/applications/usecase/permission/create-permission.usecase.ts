import { Injectable, Inject } from '@nestjs/common';
import { PermissionEntity } from '../../../core/domain/permission.entity';
import type { PermissionRepositoryPort } from '../../../core/port/permission-repository.port';
import { CreatePermissionDto } from '../../dto/permission/create-permission.dto';

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject('PermissionRepositoryPort')
    private readonly repository: PermissionRepositoryPort,
  ) {}

  async execute(dto: CreatePermissionDto): Promise<PermissionEntity> {
    const entity = new PermissionEntity({
      code: dto.code,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

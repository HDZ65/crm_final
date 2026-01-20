import { Injectable, Inject } from '@nestjs/common';
import { RoleEntity } from '../../../core/domain/role.entity';
import type { RoleRepositoryPort } from '../../../core/port/role-repository.port';
import { CreateRoleDto } from '../../dto/role/create-role.dto';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryPort')
    private readonly repository: RoleRepositoryPort,
  ) {}

  async execute(dto: CreateRoleDto): Promise<RoleEntity> {
    const entity = new RoleEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

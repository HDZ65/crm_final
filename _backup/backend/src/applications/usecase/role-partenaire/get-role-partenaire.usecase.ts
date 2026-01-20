import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RolePartenaireEntity } from '../../../core/domain/role-partenaire.entity';
import type { RolePartenaireRepositoryPort } from '../../../core/port/role-partenaire-repository.port';

@Injectable()
export class GetRolePartenaireUseCase {
  constructor(
    @Inject('RolePartenaireRepositoryPort')
    private readonly repository: RolePartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<RolePartenaireEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'RolePartenaire with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<RolePartenaireEntity[]> {
    return await this.repository.findAll();
  }
}

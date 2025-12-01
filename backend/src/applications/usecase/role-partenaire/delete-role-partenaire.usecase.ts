import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { RolePartenaireRepositoryPort } from '../../../core/port/role-partenaire-repository.port';

@Injectable()
export class DeleteRolePartenaireUseCase {
  constructor(
    @Inject('RolePartenaireRepositoryPort')
    private readonly repository: RolePartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'RolePartenaire with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

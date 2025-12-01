import { Injectable, Inject } from '@nestjs/common';
import type { OrganisationRepositoryPort } from '../../../core/port/organisation-repository.port';

@Injectable()
export class DeleteOrganisationUseCase {
  constructor(
    @Inject('OrganisationRepositoryPort')
    private readonly repository: OrganisationRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

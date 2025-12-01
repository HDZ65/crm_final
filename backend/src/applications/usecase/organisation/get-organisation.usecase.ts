import { Injectable, Inject } from '@nestjs/common';
import { OrganisationEntity } from '../../../core/domain/organisation.entity';
import type { OrganisationRepositoryPort } from '../../../core/port/organisation-repository.port';

@Injectable()
export class GetOrganisationUseCase {
  constructor(
    @Inject('OrganisationRepositoryPort')
    private readonly repository: OrganisationRepositoryPort,
  ) {}

  async findById(id: string): Promise<OrganisationEntity | null> {
    return await this.repository.findById(id);
  }

  async findAll(): Promise<OrganisationEntity[]> {
    return await this.repository.findAll();
  }
}

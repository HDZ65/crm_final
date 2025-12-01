import { Injectable, Inject } from '@nestjs/common';
import { OrganisationEntity } from '../../../core/domain/organisation.entity';
import type { OrganisationRepositoryPort } from '../../../core/port/organisation-repository.port';
import { UpdateOrganisationDto } from '../../dto/organisation/update-organisation.dto';

@Injectable()
export class UpdateOrganisationUseCase {
  constructor(
    @Inject('OrganisationRepositoryPort')
    private readonly repository: OrganisationRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateOrganisationDto,
  ): Promise<OrganisationEntity> {
    return await this.repository.update(id, dto as Partial<OrganisationEntity>);
  }
}

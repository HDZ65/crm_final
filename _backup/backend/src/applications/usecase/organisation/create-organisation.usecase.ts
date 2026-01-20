import { Injectable, Inject } from '@nestjs/common';
import { OrganisationEntity } from '../../../core/domain/organisation.entity';
import type { OrganisationRepositoryPort } from '../../../core/port/organisation-repository.port';
import { CreateOrganisationDto } from '../../dto/organisation/create-organisation.dto';

@Injectable()
export class CreateOrganisationUseCase {
  constructor(
    @Inject('OrganisationRepositoryPort')
    private readonly repository: OrganisationRepositoryPort,
  ) {}

  async execute(dto: CreateOrganisationDto): Promise<OrganisationEntity> {
    const entity = new OrganisationEntity({
      nom: dto.nom,
      description: dto.description,
      siret: dto.siret,
      adresse: dto.adresse,
      telephone: dto.telephone,
      email: dto.email,
      actif: dto.actif ?? true,
    });

    return await this.repository.create(entity);
  }
}

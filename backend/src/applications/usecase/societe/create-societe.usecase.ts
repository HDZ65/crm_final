import { Injectable, Inject } from '@nestjs/common';
import { SocieteEntity } from '../../../core/domain/societe.entity';
import type { SocieteRepositoryPort } from '../../../core/port/societe-repository.port';
import { CreateSocieteDto } from '../../dto/societe/create-societe.dto';

@Injectable()
export class CreateSocieteUseCase {
  constructor(
    @Inject('SocieteRepositoryPort')
    private readonly repository: SocieteRepositoryPort,
  ) {}

  async execute(dto: CreateSocieteDto): Promise<SocieteEntity> {
    const entity = new SocieteEntity({
      organisationId: dto.organisationId,
      raisonSociale: dto.raisonSociale,
      siren: dto.siren,
      numeroTVA: dto.numeroTVA,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

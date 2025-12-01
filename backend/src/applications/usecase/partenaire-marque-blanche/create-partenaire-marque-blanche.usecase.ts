import { Injectable, Inject } from '@nestjs/common';
import { PartenaireMarqueBlancheEntity } from '../../../core/domain/partenaire-marque-blanche.entity';
import type { PartenaireMarqueBlancheRepositoryPort } from '../../../core/port/partenaire-marque-blanche-repository.port';
import { CreatePartenaireMarqueBlancheDto } from '../../dto/partenaire-marque-blanche/create-partenaire-marque-blanche.dto';

@Injectable()
export class CreatePartenaireMarqueBlancheUseCase {
  constructor(
    @Inject('PartenaireMarqueBlancheRepositoryPort')
    private readonly repository: PartenaireMarqueBlancheRepositoryPort,
  ) {}

  async execute(
    dto: CreatePartenaireMarqueBlancheDto,
  ): Promise<PartenaireMarqueBlancheEntity> {
    const entity = new PartenaireMarqueBlancheEntity({
      denomination: dto.denomination,
      siren: dto.siren,
      numeroTVA: dto.numeroTVA,
      contactSupportEmail: dto.contactSupportEmail,
      telephone: dto.telephone,
      statutId: dto.statutId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

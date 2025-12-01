import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PartenaireMarqueBlancheEntity } from '../../../core/domain/partenaire-marque-blanche.entity';
import type { PartenaireMarqueBlancheRepositoryPort } from '../../../core/port/partenaire-marque-blanche-repository.port';
import { UpdatePartenaireMarqueBlancheDto } from '../../dto/partenaire-marque-blanche/update-partenaire-marque-blanche.dto';

@Injectable()
export class UpdatePartenaireMarqueBlancheUseCase {
  constructor(
    @Inject('PartenaireMarqueBlancheRepositoryPort')
    private readonly repository: PartenaireMarqueBlancheRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePartenaireMarqueBlancheDto,
  ): Promise<PartenaireMarqueBlancheEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'PartenaireMarqueBlanche with id ' + id + ' not found',
      );
    }

    if (dto.denomination !== undefined) {
      existing.denomination = dto.denomination;
    }
    if (dto.siren !== undefined) {
      existing.siren = dto.siren;
    }
    if (dto.numeroTVA !== undefined) {
      existing.numeroTVA = dto.numeroTVA;
    }
    if (dto.contactSupportEmail !== undefined) {
      existing.contactSupportEmail = dto.contactSupportEmail;
    }
    if (dto.telephone !== undefined) {
      existing.telephone = dto.telephone;
    }
    if (dto.statutId !== undefined) {
      existing.statutId = dto.statutId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

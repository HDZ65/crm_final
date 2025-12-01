import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AffectationGroupeClientEntity } from '../../../core/domain/affectation-groupe-client.entity';
import type { AffectationGroupeClientRepositoryPort } from '../../../core/port/affectation-groupe-client-repository.port';
import { UpdateAffectationGroupeClientDto } from '../../dto/affectation-groupe-client/update-affectation-groupe-client.dto';

@Injectable()
export class UpdateAffectationGroupeClientUseCase {
  constructor(
    @Inject('AffectationGroupeClientRepositoryPort')
    private readonly repository: AffectationGroupeClientRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateAffectationGroupeClientDto,
  ): Promise<AffectationGroupeClientEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'AffectationGroupeClient with id ' + id + ' not found',
      );
    }

    if (dto.groupeId !== undefined) {
      existing.groupeId = dto.groupeId;
    }
    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

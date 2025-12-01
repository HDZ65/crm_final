import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SocieteEntity } from '../../../core/domain/societe.entity';
import type { SocieteRepositoryPort } from '../../../core/port/societe-repository.port';
import { UpdateSocieteDto } from '../../dto/societe/update-societe.dto';

@Injectable()
export class UpdateSocieteUseCase {
  constructor(
    @Inject('SocieteRepositoryPort')
    private readonly repository: SocieteRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateSocieteDto): Promise<SocieteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Societe with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.raisonSociale !== undefined) {
      existing.raisonSociale = dto.raisonSociale;
    }
    if (dto.siren !== undefined) {
      existing.siren = dto.siren;
    }
    if (dto.numeroTVA !== undefined) {
      existing.numeroTVA = dto.numeroTVA;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

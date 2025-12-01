import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutCommissionEntity } from '../../../core/domain/statut-commission.entity';
import type { StatutCommissionRepositoryPort } from '../../../core/port/statut-commission-repository.port';
import { UpdateStatutCommissionDto } from '../../dto/statut-commission/update-statut-commission.dto';

@Injectable()
export class UpdateStatutCommissionUseCase {
  constructor(
    @Inject('StatutCommissionRepositoryPort')
    private readonly repository: StatutCommissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateStatutCommissionDto,
  ): Promise<StatutCommissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'StatutCommission with id ' + id + ' not found',
      );
    }

    if (dto.code !== undefined) {
      existing.code = dto.code;
    }
    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    if (dto.ordreAffichage !== undefined) {
      existing.ordreAffichage = dto.ordreAffichage;
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConditionPaiementEntity } from '../../../core/domain/condition-paiement.entity';
import type { ConditionPaiementRepositoryPort } from '../../../core/port/condition-paiement-repository.port';
import { UpdateConditionPaiementDto } from '../../dto/condition-paiement/update-condition-paiement.dto';

@Injectable()
export class UpdateConditionPaiementUseCase {
  constructor(
    @Inject('ConditionPaiementRepositoryPort')
    private readonly repository: ConditionPaiementRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateConditionPaiementDto,
  ): Promise<ConditionPaiementEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ConditionPaiement with id ' + id + ' not found',
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
    if (dto.delaiJours !== undefined) {
      existing.delaiJours = dto.delaiJours;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

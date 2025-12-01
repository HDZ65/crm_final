import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EvenementSuiviEntity } from '../../../core/domain/evenement-suivi.entity';
import type { EvenementSuiviRepositoryPort } from '../../../core/port/evenement-suivi-repository.port';
import { UpdateEvenementSuiviDto } from '../../dto/evenement-suivi/update-evenement-suivi.dto';

@Injectable()
export class UpdateEvenementSuiviUseCase {
  constructor(
    @Inject('EvenementSuiviRepositoryPort')
    private readonly repository: EvenementSuiviRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateEvenementSuiviDto,
  ): Promise<EvenementSuiviEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'EvenementSuivi with id ' + id + ' not found',
      );
    }

    if (dto.expeditionId !== undefined) {
      existing.expeditionId = dto.expeditionId;
    }
    if (dto.code !== undefined) {
      existing.code = dto.code;
    }
    if (dto.label !== undefined) {
      existing.label = dto.label;
    }
    if (dto.dateEvenement !== undefined) {
      existing.dateEvenement = dto.dateEvenement;
    }
    if (dto.lieu !== undefined) {
      existing.lieu = dto.lieu;
    }
    if (dto.raw !== undefined) {
      existing.raw = dto.raw;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

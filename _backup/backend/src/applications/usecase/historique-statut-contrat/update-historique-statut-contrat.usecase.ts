import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { HistoriqueStatutContratEntity } from '../../../core/domain/historique-statut-contrat.entity';
import type { HistoriqueStatutContratRepositoryPort } from '../../../core/port/historique-statut-contrat-repository.port';
import { UpdateHistoriqueStatutContratDto } from '../../dto/historique-statut-contrat/update-historique-statut-contrat.dto';

@Injectable()
export class UpdateHistoriqueStatutContratUseCase {
  constructor(
    @Inject('HistoriqueStatutContratRepositoryPort')
    private readonly repository: HistoriqueStatutContratRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateHistoriqueStatutContratDto,
  ): Promise<HistoriqueStatutContratEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'HistoriqueStatutContrat with id ' + id + ' not found',
      );
    }

    if (dto.ancienStatutId !== undefined) {
      existing.ancienStatutId = dto.ancienStatutId;
    }
    if (dto.nouveauStatutId !== undefined) {
      existing.nouveauStatutId = dto.nouveauStatutId;
    }
    if (dto.dateChangement !== undefined) {
      existing.dateChangement = dto.dateChangement;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

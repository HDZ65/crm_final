import { Injectable, Inject } from '@nestjs/common';
import { HistoriqueStatutContratEntity } from '../../../core/domain/historique-statut-contrat.entity';
import type { HistoriqueStatutContratRepositoryPort } from '../../../core/port/historique-statut-contrat-repository.port';
import { CreateHistoriqueStatutContratDto } from '../../dto/historique-statut-contrat/create-historique-statut-contrat.dto';

@Injectable()
export class CreateHistoriqueStatutContratUseCase {
  constructor(
    @Inject('HistoriqueStatutContratRepositoryPort')
    private readonly repository: HistoriqueStatutContratRepositoryPort,
  ) {}

  async execute(
    dto: CreateHistoriqueStatutContratDto,
  ): Promise<HistoriqueStatutContratEntity> {
    const entity = new HistoriqueStatutContratEntity({
      contratId: dto.contratId,
      ancienStatutId: dto.ancienStatutId,
      nouveauStatutId: dto.nouveauStatutId,
      dateChangement: dto.dateChangement,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

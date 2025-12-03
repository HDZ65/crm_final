import { Injectable, Inject } from '@nestjs/common';
import { HistoriqueRelanceEntity, RelanceResultat } from '../../../core/domain/historique-relance.entity';
import type { HistoriqueRelanceRepositoryPort } from '../../../core/port/historique-relance-repository.port';
import { CreateHistoriqueRelanceDto } from '../../dto/historique-relance/create-historique-relance.dto';

@Injectable()
export class CreateHistoriqueRelanceUseCase {
  constructor(
    @Inject('HistoriqueRelanceRepositoryPort')
    private readonly repository: HistoriqueRelanceRepositoryPort,
  ) {}

  async execute(dto: CreateHistoriqueRelanceDto): Promise<HistoriqueRelanceEntity> {
    const entity = new HistoriqueRelanceEntity({
      organisationId: dto.organisationId,
      regleRelanceId: dto.regleRelanceId,
      clientId: dto.clientId,
      contratId: dto.contratId,
      factureId: dto.factureId,
      tacheCreeeId: dto.tacheCreeeId,
      dateExecution: new Date(dto.dateExecution),
      resultat: dto.resultat as RelanceResultat,
      messageErreur: dto.messageErreur,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}

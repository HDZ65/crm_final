import { Injectable, Inject } from '@nestjs/common';
import { LigneContratEntity } from '../../../core/domain/ligne-contrat.entity';
import type { LigneContratRepositoryPort } from '../../../core/port/ligne-contrat-repository.port';
import { CreateLigneContratDto } from '../../dto/ligne-contrat/create-ligne-contrat.dto';

@Injectable()
export class CreateLigneContratUseCase {
  constructor(
    @Inject('LigneContratRepositoryPort')
    private readonly repository: LigneContratRepositoryPort,
  ) {}

  async execute(dto: CreateLigneContratDto): Promise<LigneContratEntity> {
    const entity = new LigneContratEntity({
      quantite: dto.quantite,
      prixUnitaire: dto.prixUnitaire,
      contratId: dto.contratId,
      periodeFacturationId: dto.periodeFacturationId,
      produitId: dto.produitId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

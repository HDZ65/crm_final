import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LigneContratEntity } from '../../../core/domain/ligne-contrat.entity';
import type { LigneContratRepositoryPort } from '../../../core/port/ligne-contrat-repository.port';
import { UpdateLigneContratDto } from '../../dto/ligne-contrat/update-ligne-contrat.dto';

@Injectable()
export class UpdateLigneContratUseCase {
  constructor(
    @Inject('LigneContratRepositoryPort')
    private readonly repository: LigneContratRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateLigneContratDto,
  ): Promise<LigneContratEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('LigneContrat with id ' + id + ' not found');
    }

    if (dto.quantite !== undefined) {
      existing.quantite = dto.quantite;
    }
    if (dto.prixUnitaire !== undefined) {
      existing.prixUnitaire = dto.prixUnitaire;
    }
    if (dto.periodeFacturationId !== undefined) {
      existing.periodeFacturationId = dto.periodeFacturationId;
    }
    if (dto.produitId !== undefined) {
      existing.produitId = dto.produitId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

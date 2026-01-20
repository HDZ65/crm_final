import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrixProduitEntity } from '../../../core/domain/prix-produit.entity';
import type { PrixProduitRepositoryPort } from '../../../core/port/prix-produit-repository.port';
import { UpdatePrixProduitDto } from '../../dto/prix-produit/update-prix-produit.dto';

@Injectable()
export class UpdatePrixProduitUseCase {
  constructor(
    @Inject('PrixProduitRepositoryPort')
    private readonly repository: PrixProduitRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePrixProduitDto,
  ): Promise<PrixProduitEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('PrixProduit with id ' + id + ' not found');
    }

    if (dto.prix !== undefined) {
      existing.prix = dto.prix;
    }
    if (dto.periodeFacturationId !== undefined) {
      existing.periodeFacturationId = dto.periodeFacturationId;
    }
    if (dto.remisePourcent !== undefined) {
      existing.remisePourcent = dto.remisePourcent;
    }
    if (dto.produitId !== undefined) {
      existing.produitId = dto.produitId;
    }
    if (dto.grilleTarifaireId !== undefined) {
      existing.grilleTarifaireId = dto.grilleTarifaireId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

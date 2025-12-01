import { Injectable, Inject } from '@nestjs/common';
import { PrixProduitEntity } from '../../../core/domain/prix-produit.entity';
import type { PrixProduitRepositoryPort } from '../../../core/port/prix-produit-repository.port';
import { CreatePrixProduitDto } from '../../dto/prix-produit/create-prix-produit.dto';

@Injectable()
export class CreatePrixProduitUseCase {
  constructor(
    @Inject('PrixProduitRepositoryPort')
    private readonly repository: PrixProduitRepositoryPort,
  ) {}

  async execute(dto: CreatePrixProduitDto): Promise<PrixProduitEntity> {
    const entity = new PrixProduitEntity({
      prix: dto.prix,
      periodeFacturationId: dto.periodeFacturationId,
      remisePourcent: dto.remisePourcent,
      produitId: dto.produitId,
      grilleTarifaireId: dto.grilleTarifaireId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}

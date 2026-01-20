import { Injectable, Inject } from '@nestjs/common';
import { ProduitEntity } from '../../../core/domain/produit.entity';
import type { ProduitRepositoryPort } from '../../../core/port/produit-repository.port';
import { CreateProduitDto } from '../../dto/produit/create-produit.dto';

@Injectable()
export class CreateProduitUseCase {
  constructor(
    @Inject('ProduitRepositoryPort')
    private readonly repository: ProduitRepositoryPort,
  ) {}

  async execute(dto: CreateProduitDto): Promise<ProduitEntity> {
    const entity = new ProduitEntity({
      societeId: dto.societeId,
      gammeId: dto.gammeId,
      sku: dto.sku,
      nom: dto.nom,
      description: dto.description,
      categorie: dto.categorie,
      type: dto.type,
      prix: dto.prix,
      tauxTVA: dto.tauxTVA ?? 20,
      devise: dto.devise || 'EUR',
      fournisseur: dto.fournisseur,
      actif: dto.actif,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}

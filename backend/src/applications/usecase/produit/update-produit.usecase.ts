import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProduitEntity } from '../../../core/domain/produit.entity';
import type { ProduitRepositoryPort } from '../../../core/port/produit-repository.port';
import { UpdateProduitDto } from '../../dto/produit/update-produit.dto';

@Injectable()
export class UpdateProduitUseCase {
  constructor(
    @Inject('ProduitRepositoryPort')
    private readonly repository: ProduitRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateProduitDto): Promise<ProduitEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Produit with id ' + id + ' not found');
    }

    if (dto.sku !== undefined) {
      existing.sku = dto.sku;
    }
    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    if (dto.categorie !== undefined) {
      existing.categorie = dto.categorie;
    }
    if (dto.type !== undefined) {
      existing.type = dto.type;
    }
    if (dto.prix !== undefined) {
      existing.prix = dto.prix;
    }
    if (dto.tauxTVA !== undefined) {
      existing.tauxTVA = dto.tauxTVA;
    }
    if (dto.devise !== undefined) {
      existing.devise = dto.devise;
    }
    if (dto.fournisseur !== undefined) {
      existing.fournisseur = dto.fournisseur;
    }
    if (dto.actif !== undefined) {
      existing.actif = dto.actif;
    }
    // Champs promotion
    if (dto.promotionActive !== undefined) {
      existing.promotionActive = dto.promotionActive;
    }
    if (dto.promotionPourcentage !== undefined) {
      existing.promotionPourcentage = dto.promotionPourcentage;
    }
    if (dto.promotionDateDebut !== undefined) {
      existing.promotionDateDebut = dto.promotionDateDebut;
    }
    if (dto.promotionDateFin !== undefined) {
      existing.promotionDateFin = dto.promotionDateFin;
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}

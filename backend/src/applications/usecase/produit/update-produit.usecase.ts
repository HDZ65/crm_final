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
    if (dto.actif !== undefined) {
      existing.actif = dto.actif;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}

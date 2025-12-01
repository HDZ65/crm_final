import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ProduitRepositoryPort } from '../../../core/port/produit-repository.port';

@Injectable()
export class DeleteProduitUseCase {
  constructor(
    @Inject('ProduitRepositoryPort')
    private readonly repository: ProduitRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Produit with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

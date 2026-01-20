import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PrixProduitRepositoryPort } from '../../../core/port/prix-produit-repository.port';

@Injectable()
export class DeletePrixProduitUseCase {
  constructor(
    @Inject('PrixProduitRepositoryPort')
    private readonly repository: PrixProduitRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('PrixProduit with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

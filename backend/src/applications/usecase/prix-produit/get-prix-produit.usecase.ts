import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrixProduitEntity } from '../../../core/domain/prix-produit.entity';
import type { PrixProduitRepositoryPort } from '../../../core/port/prix-produit-repository.port';

@Injectable()
export class GetPrixProduitUseCase {
  constructor(
    @Inject('PrixProduitRepositoryPort')
    private readonly repository: PrixProduitRepositoryPort,
  ) {}

  async execute(id: string): Promise<PrixProduitEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('PrixProduit with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<PrixProduitEntity[]> {
    return await this.repository.findAll();
  }
}

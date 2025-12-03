import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProduitEntity } from '../../../core/domain/produit.entity';
import type { ProduitRepositoryPort } from '../../../core/port/produit-repository.port';

@Injectable()
export class GetProduitUseCase {
  constructor(
    @Inject('ProduitRepositoryPort')
    private readonly repository: ProduitRepositoryPort,
  ) {}

  async execute(id: string): Promise<ProduitEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Produit with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ProduitEntity[]> {
    return await this.repository.findAll();
  }

  async executeBySocieteId(societeId: string): Promise<ProduitEntity[]> {
    return await this.repository.findBySocieteId(societeId);
  }

  async executeByGammeId(gammeId: string): Promise<ProduitEntity[]> {
    return await this.repository.findByGammeId(gammeId);
  }
}

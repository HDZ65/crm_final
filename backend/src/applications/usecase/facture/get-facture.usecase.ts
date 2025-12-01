import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FactureEntity } from '../../../core/domain/facture.entity';
import type { FactureRepositoryPort } from '../../../core/port/facture-repository.port';

@Injectable()
export class GetFactureUseCase {
  constructor(
    @Inject('FactureRepositoryPort')
    private readonly repository: FactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<FactureEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Facture with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<FactureEntity[]> {
    return await this.repository.findAll();
  }
}

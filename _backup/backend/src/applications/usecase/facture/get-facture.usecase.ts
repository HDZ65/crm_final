import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FactureEntity } from '../../../core/domain/facture.entity';
import type {
  FactureRepositoryPort,
  FactureFilters,
} from '../../../core/port/facture-repository.port';

@Injectable()
export class GetFactureUseCase {
  constructor(
    @Inject('FactureRepositoryPort')
    private readonly repository: FactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<FactureEntity> {
    const entity = await this.repository.findByIdWithRelations(id);

    if (!entity) {
      throw new NotFoundException('Facture with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(filters?: FactureFilters): Promise<FactureEntity[]> {
    if (filters && Object.keys(filters).some((k) => filters[k as keyof FactureFilters])) {
      return await this.repository.findAllWithFilters(filters);
    }
    return await this.repository.findAll();
  }
}

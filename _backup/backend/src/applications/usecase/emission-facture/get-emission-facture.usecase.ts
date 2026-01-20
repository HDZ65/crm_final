import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EmissionFactureEntity } from '../../../core/domain/emission-facture.entity';
import type { EmissionFactureRepositoryPort } from '../../../core/port/emission-facture-repository.port';

@Injectable()
export class GetEmissionFactureUseCase {
  constructor(
    @Inject('EmissionFactureRepositoryPort')
    private readonly repository: EmissionFactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<EmissionFactureEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'EmissionFacture with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<EmissionFactureEntity[]> {
    return await this.repository.findAll();
  }
}

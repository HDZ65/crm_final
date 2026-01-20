import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AdresseEntity } from '../../../core/domain/adresse.entity';
import type { AdresseRepositoryPort } from '../../../core/port/adresse-repository.port';

@Injectable()
export class GetAdresseUseCase {
  constructor(
    @Inject('AdresseRepositoryPort')
    private readonly repository: AdresseRepositoryPort,
  ) {}

  async execute(id: string): Promise<AdresseEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Adresse with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<AdresseEntity[]> {
    return await this.repository.findAll();
  }
}

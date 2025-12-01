import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ColisEntity } from '../../../core/domain/colis.entity';
import type { ColisRepositoryPort } from '../../../core/port/colis-repository.port';

@Injectable()
export class GetColisUseCase {
  constructor(
    @Inject('ColisRepositoryPort')
    private readonly repository: ColisRepositoryPort,
  ) {}

  async execute(id: string): Promise<ColisEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Colis with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ColisEntity[]> {
    return await this.repository.findAll();
  }
}

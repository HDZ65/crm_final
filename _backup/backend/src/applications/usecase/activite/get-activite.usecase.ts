import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ActiviteEntity } from '../../../core/domain/activite.entity';
import type { ActiviteRepositoryPort } from '../../../core/port/activite-repository.port';

@Injectable()
export class GetActiviteUseCase {
  constructor(
    @Inject('ActiviteRepositoryPort')
    private readonly repository: ActiviteRepositoryPort,
  ) {}

  async execute(id: string): Promise<ActiviteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Activite with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ActiviteEntity[]> {
    return await this.repository.findAll();
  }
}

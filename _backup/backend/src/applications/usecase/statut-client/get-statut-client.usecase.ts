import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutClientEntity } from '../../../core/domain/statut-client.entity';
import type { StatutClientRepositoryPort } from '../../../core/port/statut-client-repository.port';

@Injectable()
export class GetStatutClientUseCase {
  constructor(
    @Inject('StatutClientRepositoryPort')
    private readonly repository: StatutClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<StatutClientEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('StatutClient with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<StatutClientEntity[]> {
    return await this.repository.findAll();
  }
}

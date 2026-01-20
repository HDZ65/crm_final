import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ExpeditionEntity } from '../../../core/domain/expedition.entity';
import type { ExpeditionRepositoryPort } from '../../../core/port/expedition-repository.port';

@Injectable()
export class GetExpeditionUseCase {
  constructor(
    @Inject('ExpeditionRepositoryPort')
    private readonly repository: ExpeditionRepositoryPort,
  ) {}

  async execute(id: string): Promise<ExpeditionEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Expedition with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ExpeditionEntity[]> {
    return await this.repository.findAll();
  }
}

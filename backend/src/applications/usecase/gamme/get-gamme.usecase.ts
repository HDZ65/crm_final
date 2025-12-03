import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GammeEntity } from '../../../core/domain/gamme.entity';
import type { GammeRepositoryPort } from '../../../core/port/gamme-repository.port';

@Injectable()
export class GetGammeUseCase {
  constructor(
    @Inject('GammeRepositoryPort')
    private readonly repository: GammeRepositoryPort,
  ) {}

  async execute(id: string): Promise<GammeEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Gamme with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<GammeEntity[]> {
    return await this.repository.findAll();
  }

  async executeBySocieteId(societeId: string): Promise<GammeEntity[]> {
    return await this.repository.findBySocieteId(societeId);
  }
}

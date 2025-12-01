import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GroupeEntiteEntity } from '../../../core/domain/groupe-entite.entity';
import type { GroupeEntiteRepositoryPort } from '../../../core/port/groupe-entite-repository.port';

@Injectable()
export class GetGroupeEntiteUseCase {
  constructor(
    @Inject('GroupeEntiteRepositoryPort')
    private readonly repository: GroupeEntiteRepositoryPort,
  ) {}

  async execute(id: string): Promise<GroupeEntiteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('GroupeEntite with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<GroupeEntiteEntity[]> {
    return await this.repository.findAll();
  }
}

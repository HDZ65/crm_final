import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GroupeEntity } from '../../../core/domain/groupe.entity';
import type { GroupeRepositoryPort } from '../../../core/port/groupe-repository.port';

@Injectable()
export class GetGroupeUseCase {
  constructor(
    @Inject('GroupeRepositoryPort')
    private readonly repository: GroupeRepositoryPort,
  ) {}

  async execute(id: string): Promise<GroupeEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Groupe with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<GroupeEntity[]> {
    return await this.repository.findAll();
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MembreGroupeEntity } from '../../../core/domain/membre-groupe.entity';
import type { MembreGroupeRepositoryPort } from '../../../core/port/membre-groupe-repository.port';

@Injectable()
export class GetMembreGroupeUseCase {
  constructor(
    @Inject('MembreGroupeRepositoryPort')
    private readonly repository: MembreGroupeRepositoryPort,
  ) {}

  async execute(id: string): Promise<MembreGroupeEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('MembreGroupe with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<MembreGroupeEntity[]> {
    return await this.repository.findAll();
  }
}

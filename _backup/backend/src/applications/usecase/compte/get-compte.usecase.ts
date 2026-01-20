import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CompteEntity } from '../../../core/domain/compte.entity';
import type { CompteRepositoryPort } from '../../../core/port/compte-repository.port';

@Injectable()
export class GetCompteUseCase {
  constructor(
    @Inject('CompteRepositoryPort')
    private readonly repository: CompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<CompteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Compte with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<CompteEntity[]> {
    return await this.repository.findAll();
  }
}

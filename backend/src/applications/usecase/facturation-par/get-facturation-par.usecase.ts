import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FacturationParEntity } from '../../../core/domain/facturation-par.entity';
import type { FacturationParRepositoryPort } from '../../../core/port/facturation-par-repository.port';

@Injectable()
export class GetFacturationParUseCase {
  constructor(
    @Inject('FacturationParRepositoryPort')
    private readonly repository: FacturationParRepositoryPort,
  ) {}

  async execute(id: string): Promise<FacturationParEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'FacturationPar with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<FacturationParEntity[]> {
    return await this.repository.findAll();
  }
}

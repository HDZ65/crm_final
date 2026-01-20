import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PeriodeFacturationEntity } from '../../../core/domain/periode-facturation.entity';
import type { PeriodeFacturationRepositoryPort } from '../../../core/port/periode-facturation-repository.port';

@Injectable()
export class GetPeriodeFacturationUseCase {
  constructor(
    @Inject('PeriodeFacturationRepositoryPort')
    private readonly repository: PeriodeFacturationRepositoryPort,
  ) {}

  async execute(id: string): Promise<PeriodeFacturationEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'PeriodeFacturation with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<PeriodeFacturationEntity[]> {
    return await this.repository.findAll();
  }
}

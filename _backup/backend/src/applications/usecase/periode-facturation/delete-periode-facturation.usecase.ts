import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PeriodeFacturationRepositoryPort } from '../../../core/port/periode-facturation-repository.port';

@Injectable()
export class DeletePeriodeFacturationUseCase {
  constructor(
    @Inject('PeriodeFacturationRepositoryPort')
    private readonly repository: PeriodeFacturationRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'PeriodeFacturation with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

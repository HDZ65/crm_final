import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { FacturationParRepositoryPort } from '../../../core/port/facturation-par-repository.port';

@Injectable()
export class DeleteFacturationParUseCase {
  constructor(
    @Inject('FacturationParRepositoryPort')
    private readonly repository: FacturationParRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'FacturationPar with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

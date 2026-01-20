import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { StatutCommissionRepositoryPort } from '../../../core/port/statut-commission-repository.port';

@Injectable()
export class DeleteStatutCommissionUseCase {
  constructor(
    @Inject('StatutCommissionRepositoryPort')
    private readonly repository: StatutCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'StatutCommission with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

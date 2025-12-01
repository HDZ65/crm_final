import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ConditionPaiementRepositoryPort } from '../../../core/port/condition-paiement-repository.port';

@Injectable()
export class DeleteConditionPaiementUseCase {
  constructor(
    @Inject('ConditionPaiementRepositoryPort')
    private readonly repository: ConditionPaiementRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ConditionPaiement with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PalierCommissionRepositoryPort } from '../../../core/port/palier-commission-repository.port';

@Injectable()
export class DeletePalierCommissionUseCase {
  constructor(
    @Inject('PalierCommissionRepositoryPort')
    private readonly repository: PalierCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'PalierCommission with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

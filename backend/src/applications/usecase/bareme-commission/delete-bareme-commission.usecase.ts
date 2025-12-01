import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { BaremeCommissionRepositoryPort } from '../../../core/port/bareme-commission-repository.port';

@Injectable()
export class DeleteBaremeCommissionUseCase {
  constructor(
    @Inject('BaremeCommissionRepositoryPort')
    private readonly repository: BaremeCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('BaremeCommission with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

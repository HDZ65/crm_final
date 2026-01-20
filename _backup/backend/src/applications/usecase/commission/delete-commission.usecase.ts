import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { CommissionRepositoryPort } from '../../../core/port/commission-repository.port';

@Injectable()
export class DeleteCommissionUseCase {
  constructor(
    @Inject('CommissionRepositoryPort')
    private readonly repository: CommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Commission with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

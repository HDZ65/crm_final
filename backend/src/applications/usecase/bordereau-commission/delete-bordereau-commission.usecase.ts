import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { BordereauCommissionRepositoryPort } from '../../../core/port/bordereau-commission-repository.port';

@Injectable()
export class DeleteBordereauCommissionUseCase {
  constructor(
    @Inject('BordereauCommissionRepositoryPort')
    private readonly repository: BordereauCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('BordereauCommission not found');
    }
    await this.repository.delete(id);
  }
}

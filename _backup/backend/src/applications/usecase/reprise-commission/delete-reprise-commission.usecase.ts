import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { RepriseCommissionRepositoryPort } from '../../../core/port/reprise-commission-repository.port';

@Injectable()
export class DeleteRepriseCommissionUseCase {
  constructor(
    @Inject('RepriseCommissionRepositoryPort')
    private readonly repository: RepriseCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'RepriseCommission with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

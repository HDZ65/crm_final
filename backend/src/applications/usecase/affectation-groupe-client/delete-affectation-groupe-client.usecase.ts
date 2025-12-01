import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { AffectationGroupeClientRepositoryPort } from '../../../core/port/affectation-groupe-client-repository.port';

@Injectable()
export class DeleteAffectationGroupeClientUseCase {
  constructor(
    @Inject('AffectationGroupeClientRepositoryPort')
    private readonly repository: AffectationGroupeClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'AffectationGroupeClient with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

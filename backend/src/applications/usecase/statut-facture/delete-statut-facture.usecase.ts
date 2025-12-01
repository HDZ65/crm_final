import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { StatutFactureRepositoryPort } from '../../../core/port/statut-facture-repository.port';

@Injectable()
export class DeleteStatutFactureUseCase {
  constructor(
    @Inject('StatutFactureRepositoryPort')
    private readonly repository: StatutFactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('StatutFacture with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

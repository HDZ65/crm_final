import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { StatutContratRepositoryPort } from '../../../core/port/statut-contrat-repository.port';

@Injectable()
export class DeleteStatutContratUseCase {
  constructor(
    @Inject('StatutContratRepositoryPort')
    private readonly repository: StatutContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('StatutContrat with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

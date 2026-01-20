import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { HistoriqueStatutContratRepositoryPort } from '../../../core/port/historique-statut-contrat-repository.port';

@Injectable()
export class DeleteHistoriqueStatutContratUseCase {
  constructor(
    @Inject('HistoriqueStatutContratRepositoryPort')
    private readonly repository: HistoriqueStatutContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'HistoriqueStatutContrat with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

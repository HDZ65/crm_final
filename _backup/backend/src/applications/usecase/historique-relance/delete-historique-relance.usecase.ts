import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { HistoriqueRelanceRepositoryPort } from '../../../core/port/historique-relance-repository.port';

@Injectable()
export class DeleteHistoriqueRelanceUseCase {
  constructor(
    @Inject('HistoriqueRelanceRepositoryPort')
    private readonly repository: HistoriqueRelanceRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `Historique de relance avec l'id ${id} non trouvé`,
      );
    }

    await this.repository.delete(id);
  }
}

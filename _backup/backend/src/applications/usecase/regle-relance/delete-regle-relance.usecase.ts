import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { RegleRelanceRepositoryPort } from '../../../core/port/regle-relance-repository.port';

@Injectable()
export class DeleteRegleRelanceUseCase {
  constructor(
    @Inject('RegleRelanceRepositoryPort')
    private readonly repository: RegleRelanceRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `Règle de relance avec l'id ${id} non trouvée`,
      );
    }

    await this.repository.delete(id);
  }
}

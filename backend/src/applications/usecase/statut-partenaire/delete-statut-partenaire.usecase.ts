import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { StatutPartenaireRepositoryPort } from '../../../core/port/statut-partenaire-repository.port';

@Injectable()
export class DeleteStatutPartenaireUseCase {
  constructor(
    @Inject('StatutPartenaireRepositoryPort')
    private readonly repository: StatutPartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'StatutPartenaire with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

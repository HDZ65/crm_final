import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { EvenementSuiviRepositoryPort } from '../../../core/port/evenement-suivi-repository.port';

@Injectable()
export class DeleteEvenementSuiviUseCase {
  constructor(
    @Inject('EvenementSuiviRepositoryPort')
    private readonly repository: EvenementSuiviRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'EvenementSuivi with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

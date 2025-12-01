import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { StatutClientRepositoryPort } from '../../../core/port/statut-client-repository.port';

@Injectable()
export class DeleteStatutClientUseCase {
  constructor(
    @Inject('StatutClientRepositoryPort')
    private readonly repository: StatutClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('StatutClient with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { LigneContratRepositoryPort } from '../../../core/port/ligne-contrat-repository.port';

@Injectable()
export class DeleteLigneContratUseCase {
  constructor(
    @Inject('LigneContratRepositoryPort')
    private readonly repository: LigneContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('LigneContrat with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

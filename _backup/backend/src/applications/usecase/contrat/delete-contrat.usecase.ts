import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ContratRepositoryPort } from '../../../core/port/contrat-repository.port';

@Injectable()
export class DeleteContratUseCase {
  constructor(
    @Inject('ContratRepositoryPort')
    private readonly repository: ContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Contrat with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

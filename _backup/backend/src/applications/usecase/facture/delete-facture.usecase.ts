import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { FactureRepositoryPort } from '../../../core/port/facture-repository.port';

@Injectable()
export class DeleteFactureUseCase {
  constructor(
    @Inject('FactureRepositoryPort')
    private readonly repository: FactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Facture with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

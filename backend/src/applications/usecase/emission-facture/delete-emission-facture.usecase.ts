import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { EmissionFactureRepositoryPort } from '../../../core/port/emission-facture-repository.port';

@Injectable()
export class DeleteEmissionFactureUseCase {
  constructor(
    @Inject('EmissionFactureRepositoryPort')
    private readonly repository: EmissionFactureRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'EmissionFacture with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

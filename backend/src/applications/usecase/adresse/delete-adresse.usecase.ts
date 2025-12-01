import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { AdresseRepositoryPort } from '../../../core/port/adresse-repository.port';

@Injectable()
export class DeleteAdresseUseCase {
  constructor(
    @Inject('AdresseRepositoryPort')
    private readonly repository: AdresseRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Adresse with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

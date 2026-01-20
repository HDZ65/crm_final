import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { CompteRepositoryPort } from '../../../core/port/compte-repository.port';

@Injectable()
export class DeleteCompteUseCase {
  constructor(
    @Inject('CompteRepositoryPort')
    private readonly repository: CompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Compte with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

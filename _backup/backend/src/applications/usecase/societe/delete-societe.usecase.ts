import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { SocieteRepositoryPort } from '../../../core/port/societe-repository.port';

@Injectable()
export class DeleteSocieteUseCase {
  constructor(
    @Inject('SocieteRepositoryPort')
    private readonly repository: SocieteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Societe with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

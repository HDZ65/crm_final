import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ActiviteRepositoryPort } from '../../../core/port/activite-repository.port';

@Injectable()
export class DeleteActiviteUseCase {
  constructor(
    @Inject('ActiviteRepositoryPort')
    private readonly repository: ActiviteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Activite with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

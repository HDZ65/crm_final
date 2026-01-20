import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ExpeditionRepositoryPort } from '../../../core/port/expedition-repository.port';

@Injectable()
export class DeleteExpeditionUseCase {
  constructor(
    @Inject('ExpeditionRepositoryPort')
    private readonly repository: ExpeditionRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Expedition with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

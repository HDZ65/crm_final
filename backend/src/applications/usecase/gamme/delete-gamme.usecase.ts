import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { GammeRepositoryPort } from '../../../core/port/gamme-repository.port';

@Injectable()
export class DeleteGammeUseCase {
  constructor(
    @Inject('GammeRepositoryPort')
    private readonly repository: GammeRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Gamme with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

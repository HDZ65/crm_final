import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ColisRepositoryPort } from '../../../core/port/colis-repository.port';

@Injectable()
export class DeleteColisUseCase {
  constructor(
    @Inject('ColisRepositoryPort')
    private readonly repository: ColisRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Colis with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

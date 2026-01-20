import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ApporteurRepositoryPort } from '../../../core/port/apporteur-repository.port';

@Injectable()
export class DeleteApporteurUseCase {
  constructor(
    @Inject('ApporteurRepositoryPort')
    private readonly repository: ApporteurRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Apporteur with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

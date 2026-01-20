import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ClientBaseRepositoryPort } from '../../../core/port/client-base-repository.port';

@Injectable()
export class DeleteClientBaseUseCase {
  constructor(
    @Inject('ClientBaseRepositoryPort')
    private readonly repository: ClientBaseRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`ClientBase with id ${id} not found`);
    }

    await this.repository.delete(id);
  }
}

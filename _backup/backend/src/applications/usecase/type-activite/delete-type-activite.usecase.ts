import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { TypeActiviteRepositoryPort } from '../../../core/port/type-activite-repository.port';

@Injectable()
export class DeleteTypeActiviteUseCase {
  constructor(
    @Inject('TypeActiviteRepositoryPort')
    private readonly repository: TypeActiviteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('TypeActivite with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

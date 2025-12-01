import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { GroupeEntiteRepositoryPort } from '../../../core/port/groupe-entite-repository.port';

@Injectable()
export class DeleteGroupeEntiteUseCase {
  constructor(
    @Inject('GroupeEntiteRepositoryPort')
    private readonly repository: GroupeEntiteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('GroupeEntite with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

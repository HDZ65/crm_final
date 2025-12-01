import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { GroupeRepositoryPort } from '../../../core/port/groupe-repository.port';

@Injectable()
export class DeleteGroupeUseCase {
  constructor(
    @Inject('GroupeRepositoryPort')
    private readonly repository: GroupeRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Groupe with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

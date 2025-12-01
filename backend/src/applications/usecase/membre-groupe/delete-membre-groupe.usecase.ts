import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { MembreGroupeRepositoryPort } from '../../../core/port/membre-groupe-repository.port';

@Injectable()
export class DeleteMembreGroupeUseCase {
  constructor(
    @Inject('MembreGroupeRepositoryPort')
    private readonly repository: MembreGroupeRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('MembreGroupe with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}

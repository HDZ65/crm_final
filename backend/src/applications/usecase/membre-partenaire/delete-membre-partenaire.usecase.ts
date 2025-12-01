import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { MembrePartenaireRepositoryPort } from '../../../core/port/membre-partenaire-repository.port';

@Injectable()
export class DeleteMembrePartenaireUseCase {
  constructor(
    @Inject('MembrePartenaireRepositoryPort')
    private readonly repository: MembrePartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'MembrePartenaire with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

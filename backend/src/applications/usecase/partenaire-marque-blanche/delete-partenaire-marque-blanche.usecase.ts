import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PartenaireMarqueBlancheRepositoryPort } from '../../../core/port/partenaire-marque-blanche-repository.port';

@Injectable()
export class DeletePartenaireMarqueBlancheUseCase {
  constructor(
    @Inject('PartenaireMarqueBlancheRepositoryPort')
    private readonly repository: PartenaireMarqueBlancheRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'PartenaireMarqueBlanche with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

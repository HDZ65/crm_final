import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ClientPartenaireRepositoryPort } from '../../../core/port/client-partenaire-repository.port';

@Injectable()
export class DeleteClientPartenaireUseCase {
  constructor(
    @Inject('ClientPartenaireRepositoryPort')
    private readonly repository: ClientPartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ClientPartenaire with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { TransporteurCompteRepositoryPort } from '../../../core/port/transporteur-compte-repository.port';

@Injectable()
export class DeleteTransporteurCompteUseCase {
  constructor(
    @Inject('TransporteurCompteRepositoryPort')
    private readonly repository: TransporteurCompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'TransporteurCompte with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}

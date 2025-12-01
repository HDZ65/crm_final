import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TransporteurCompteEntity } from '../../../core/domain/transporteur-compte.entity';
import type { TransporteurCompteRepositoryPort } from '../../../core/port/transporteur-compte-repository.port';

@Injectable()
export class GetTransporteurCompteUseCase {
  constructor(
    @Inject('TransporteurCompteRepositoryPort')
    private readonly repository: TransporteurCompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<TransporteurCompteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'TransporteurCompte with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<TransporteurCompteEntity[]> {
    return await this.repository.findAll();
  }
}

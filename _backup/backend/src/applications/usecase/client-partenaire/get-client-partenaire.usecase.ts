import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientPartenaireEntity } from '../../../core/domain/client-partenaire.entity';
import type { ClientPartenaireRepositoryPort } from '../../../core/port/client-partenaire-repository.port';

@Injectable()
export class GetClientPartenaireUseCase {
  constructor(
    @Inject('ClientPartenaireRepositoryPort')
    private readonly repository: ClientPartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<ClientPartenaireEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'ClientPartenaire with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<ClientPartenaireEntity[]> {
    return await this.repository.findAll();
  }
}

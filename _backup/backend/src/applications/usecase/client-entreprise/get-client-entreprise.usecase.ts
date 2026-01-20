import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientEntrepriseEntity } from '../../../core/domain/client-entreprise.entity';
import type { ClientEntrepriseRepositoryPort } from '../../../core/port/client-entreprise-repository.port';

@Injectable()
export class GetClientEntrepriseUseCase {
  constructor(
    @Inject('ClientEntrepriseRepositoryPort')
    private readonly repository: ClientEntrepriseRepositoryPort,
  ) {}

  async execute(id: string): Promise<ClientEntrepriseEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'ClientEntreprise with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<ClientEntrepriseEntity[]> {
    return await this.repository.findAll();
  }
}

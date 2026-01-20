import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ApporteurEntity } from '../../../core/domain/apporteur.entity';
import type { ApporteurRepositoryPort } from '../../../core/port/apporteur-repository.port';

@Injectable()
export class GetApporteurUseCase {
  constructor(
    @Inject('ApporteurRepositoryPort')
    private readonly repository: ApporteurRepositoryPort,
  ) {}

  async execute(id: string): Promise<ApporteurEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Apporteur with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ApporteurEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<ApporteurEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MembreCompteEntity } from '../../../core/domain/membre-compte.entity';
import type { MembreCompteRepositoryPort } from '../../../core/port/membre-compte-repository.port';

@Injectable()
export class GetMembreCompteUseCase {
  constructor(
    @Inject('MembreCompteRepositoryPort')
    private readonly repository: MembreCompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<MembreCompteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('MembreCompte with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<MembreCompteEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(organisationId: string): Promise<MembreCompteEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }
}

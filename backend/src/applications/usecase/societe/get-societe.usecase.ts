import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SocieteEntity } from '../../../core/domain/societe.entity';
import type { SocieteRepositoryPort } from '../../../core/port/societe-repository.port';

@Injectable()
export class GetSocieteUseCase {
  constructor(
    @Inject('SocieteRepositoryPort')
    private readonly repository: SocieteRepositoryPort,
  ) {}

  async execute(id: string): Promise<SocieteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Societe with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<SocieteEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisation(organisationId: string): Promise<SocieteEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }
}

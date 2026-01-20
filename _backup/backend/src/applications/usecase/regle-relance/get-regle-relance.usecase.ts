import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  RegleRelanceEntity,
  RelanceDeclencheur,
} from '../../../core/domain/regle-relance.entity';
import type { RegleRelanceRepositoryPort } from '../../../core/port/regle-relance-repository.port';

@Injectable()
export class GetRegleRelanceUseCase {
  constructor(
    @Inject('RegleRelanceRepositoryPort')
    private readonly repository: RegleRelanceRepositoryPort,
  ) {}

  async execute(id: string): Promise<RegleRelanceEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(
        `Règle de relance avec l'id ${id} non trouvée`,
      );
    }
    return entity;
  }

  async executeAll(): Promise<RegleRelanceEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<RegleRelanceEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeActives(organisationId: string): Promise<RegleRelanceEntity[]> {
    return await this.repository.findActives(organisationId);
  }

  async executeByDeclencheur(
    organisationId: string,
    declencheur: RelanceDeclencheur,
  ): Promise<RegleRelanceEntity[]> {
    return await this.repository.findByDeclencheur(organisationId, declencheur);
  }

  async executeActivesByDeclencheur(
    organisationId: string,
    declencheur: RelanceDeclencheur,
  ): Promise<RegleRelanceEntity[]> {
    return await this.repository.findActivesByDeclencheur(
      organisationId,
      declencheur,
    );
  }
}

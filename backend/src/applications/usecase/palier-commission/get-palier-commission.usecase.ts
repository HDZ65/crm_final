import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PalierCommissionEntity } from '../../../core/domain/palier-commission.entity';
import type { PalierCommissionRepositoryPort } from '../../../core/port/palier-commission-repository.port';

@Injectable()
export class GetPalierCommissionUseCase {
  constructor(
    @Inject('PalierCommissionRepositoryPort')
    private readonly repository: PalierCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<PalierCommissionEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('PalierCommission with id ' + id + ' not found');
    }
    return entity;
  }

  async executeAll(): Promise<PalierCommissionEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<PalierCommissionEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeByBaremeId(baremeId: string): Promise<PalierCommissionEntity[]> {
    return await this.repository.findByBaremeId(baremeId);
  }

  async executeActifsByBaremeId(
    baremeId: string,
  ): Promise<PalierCommissionEntity[]> {
    return await this.repository.findActifsByBaremeId(baremeId);
  }

  async executePalierApplicable(
    baremeId: string,
    typePalier: string,
    valeur: number,
  ): Promise<PalierCommissionEntity | null> {
    return await this.repository.findPalierApplicable(baremeId, typePalier, valeur);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaremeCommissionEntity } from '../../../core/domain/bareme-commission.entity';
import type { BaremeCommissionRepositoryPort } from '../../../core/port/bareme-commission-repository.port';

@Injectable()
export class GetBaremeCommissionUseCase {
  constructor(
    @Inject('BaremeCommissionRepositoryPort')
    private readonly repository: BaremeCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<BaremeCommissionEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(
        'BaremeCommission with id ' + id + ' not found',
      );
    }
    return entity;
  }

  async executeAll(): Promise<BaremeCommissionEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<BaremeCommissionEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeActifs(
    organisationId?: string,
  ): Promise<BaremeCommissionEntity[]> {
    return await this.repository.findActifs(organisationId);
  }

  async executeByCode(code: string): Promise<BaremeCommissionEntity | null> {
    return await this.repository.findByCode(code);
  }

  async executeByTypeProduit(
    typeProduit: string,
  ): Promise<BaremeCommissionEntity[]> {
    return await this.repository.findByTypeProduit(typeProduit);
  }

  async executeApplicable(
    organisationId: string,
    typeProduit?: string,
    profilRemuneration?: string,
    date?: Date,
  ): Promise<BaremeCommissionEntity | null> {
    return await this.repository.findApplicable(
      organisationId,
      typeProduit,
      profilRemuneration,
      date,
    );
  }
}

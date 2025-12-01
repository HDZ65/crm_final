import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RepriseCommissionEntity } from '../../../core/domain/reprise-commission.entity';
import type { RepriseCommissionRepositoryPort } from '../../../core/port/reprise-commission-repository.port';

@Injectable()
export class GetRepriseCommissionUseCase {
  constructor(
    @Inject('RepriseCommissionRepositoryPort')
    private readonly repository: RepriseCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<RepriseCommissionEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('RepriseCommission with id ' + id + ' not found');
    }
    return entity;
  }

  async executeAll(): Promise<RepriseCommissionEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<RepriseCommissionEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeByApporteurId(
    apporteurId: string,
  ): Promise<RepriseCommissionEntity[]> {
    return await this.repository.findByApporteurId(apporteurId);
  }

  async executeByContratId(contratId: string): Promise<RepriseCommissionEntity[]> {
    return await this.repository.findByContratId(contratId);
  }

  async executeEnAttente(
    organisationId?: string,
  ): Promise<RepriseCommissionEntity[]> {
    return await this.repository.findEnAttente(organisationId);
  }

  async executeByPeriode(periode: string): Promise<RepriseCommissionEntity[]> {
    return await this.repository.findByPeriodeApplication(periode);
  }
}

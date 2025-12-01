import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CommissionEntity } from '../../../core/domain/commission.entity';
import type { CommissionRepositoryPort } from '../../../core/port/commission-repository.port';

@Injectable()
export class GetCommissionUseCase {
  constructor(
    @Inject('CommissionRepositoryPort')
    private readonly repository: CommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<CommissionEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Commission with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<CommissionEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<CommissionEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeByApporteurId(apporteurId: string): Promise<CommissionEntity[]> {
    return await this.repository.findByApporteurId(apporteurId);
  }

  async executeByPeriode(periode: string): Promise<CommissionEntity[]> {
    return await this.repository.findByPeriode(periode);
  }
}

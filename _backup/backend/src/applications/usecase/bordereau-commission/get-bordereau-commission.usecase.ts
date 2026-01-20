import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BordereauCommissionEntity } from '../../../core/domain/bordereau-commission.entity';
import type {
  BordereauCommissionRepositoryPort,
  BordereauWithDetails,
} from '../../../core/port/bordereau-commission-repository.port';

@Injectable()
export class GetBordereauCommissionUseCase {
  constructor(
    @Inject('BordereauCommissionRepositoryPort')
    private readonly repository: BordereauCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<BordereauCommissionEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('BordereauCommission not found');
    }
    return entity;
  }

  async executeAll(): Promise<BordereauCommissionEntity[]> {
    return await this.repository.findAll();
  }

  async executeByOrganisationId(
    organisationId: string,
  ): Promise<BordereauCommissionEntity[]> {
    return await this.repository.findByOrganisationId(organisationId);
  }

  async executeByApporteurId(
    apporteurId: string,
  ): Promise<BordereauCommissionEntity[]> {
    return await this.repository.findByApporteurId(apporteurId);
  }

  async executeByPeriode(
    periode: string,
  ): Promise<BordereauCommissionEntity[]> {
    return await this.repository.findByPeriode(periode);
  }

  async executeByStatut(statut: string): Promise<BordereauCommissionEntity[]> {
    return await this.repository.findByStatut(statut);
  }

  async executeAllWithDetails(
    organisationId?: string,
  ): Promise<BordereauWithDetails[]> {
    return await this.repository.findAllWithDetails(organisationId);
  }
}

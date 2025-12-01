import { RepriseCommissionEntity } from '../domain/reprise-commission.entity';
import { BaseRepositoryPort } from './repository.port';

export interface RepriseCommissionRepositoryPort
  extends BaseRepositoryPort<RepriseCommissionEntity> {
  findByOrganisationId(organisationId: string): Promise<RepriseCommissionEntity[]>;
  findByCommissionOriginaleId(commissionId: string): Promise<RepriseCommissionEntity[]>;
  findByApporteurId(apporteurId: string): Promise<RepriseCommissionEntity[]>;
  findByContratId(contratId: string): Promise<RepriseCommissionEntity[]>;
  findByPeriodeApplication(periode: string): Promise<RepriseCommissionEntity[]>;
  findEnAttente(organisationId?: string): Promise<RepriseCommissionEntity[]>;
  findByBordereauId(bordereauId: string): Promise<RepriseCommissionEntity[]>;
  appliquerReprise(id: string, bordereauId: string): Promise<RepriseCommissionEntity>;
  annulerReprise(id: string, motif: string): Promise<RepriseCommissionEntity>;
}

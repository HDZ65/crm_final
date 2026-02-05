import { RepriseCommissionEntity } from '../entities/reprise-commission.entity';

export interface IRepriseCommissionRepository {
  findById(id: string): Promise<RepriseCommissionEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    apporteurId?: string;
    statutReprise?: string;
    periodeApplication?: string;
  }): Promise<RepriseCommissionEntity[]>;
  save(entity: RepriseCommissionEntity): Promise<RepriseCommissionEntity>;
  delete(id: string): Promise<void>;
}

import { BaremeCommissionEntity } from '../entities/bareme-commission.entity';

export interface IBaremeCommissionRepository {
  findById(id: string): Promise<BaremeCommissionEntity | null>;
  findByCode(code: string): Promise<BaremeCommissionEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    typeProduit?: string;
    actif?: boolean;
  }): Promise<BaremeCommissionEntity[]>;
  findWithPaliers(id: string): Promise<BaremeCommissionEntity | null>;
  save(entity: BaremeCommissionEntity): Promise<BaremeCommissionEntity>;
  delete(id: string): Promise<void>;
}

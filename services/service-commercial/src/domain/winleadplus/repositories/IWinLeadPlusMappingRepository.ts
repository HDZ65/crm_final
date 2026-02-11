import { WinLeadPlusMappingEntity } from '../entities/winleadplus-mapping.entity';

export interface IWinLeadPlusMappingRepository {
  findById(id: string): Promise<WinLeadPlusMappingEntity | null>;
  findByProspectId(organisationId: string, winleadplusProspectId: number): Promise<WinLeadPlusMappingEntity | null>;
  findByCrmClientId(crmClientId: string): Promise<WinLeadPlusMappingEntity[]>;
  findAll(filters?: {
    organisationId?: string;
  }): Promise<WinLeadPlusMappingEntity[]>;
  save(entity: WinLeadPlusMappingEntity): Promise<WinLeadPlusMappingEntity>;
  delete(id: string): Promise<void>;
}

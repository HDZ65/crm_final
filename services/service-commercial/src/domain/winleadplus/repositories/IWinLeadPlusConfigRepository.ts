import { WinLeadPlusConfigEntity } from '../entities/winleadplus-config.entity';

export interface IWinLeadPlusConfigRepository {
  findById(id: string): Promise<WinLeadPlusConfigEntity | null>;
  findByOrganisationId(organisationId: string): Promise<WinLeadPlusConfigEntity | null>;
  findAllEnabled(): Promise<WinLeadPlusConfigEntity[]>;
  save(entity: WinLeadPlusConfigEntity): Promise<WinLeadPlusConfigEntity>;
  delete(id: string): Promise<void>;
}

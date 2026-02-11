import { WinLeadPlusSyncLogEntity, WinLeadPlusSyncStatus } from '../entities/winleadplus-sync-log.entity';

export interface IWinLeadPlusSyncLogRepository {
  findById(id: string): Promise<WinLeadPlusSyncLogEntity | null>;
  findLatestByOrganisation(organisationId: string): Promise<WinLeadPlusSyncLogEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    status?: WinLeadPlusSyncStatus;
  }): Promise<WinLeadPlusSyncLogEntity[]>;
  findRunning(organisationId: string): Promise<WinLeadPlusSyncLogEntity | null>;
  save(entity: WinLeadPlusSyncLogEntity): Promise<WinLeadPlusSyncLogEntity>;
  create(input: {
    organisationId: string;
    startedAt: Date;
  }): Promise<WinLeadPlusSyncLogEntity>;
  delete(id: string): Promise<void>;
}

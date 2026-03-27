import { WinLeadPlusSyncLogEntity, WinLeadPlusSyncStatus } from '../entities/winleadplus-sync-log.entity';

export interface IWinLeadPlusSyncLogRepository {
  findById(id: string): Promise<WinLeadPlusSyncLogEntity | null>;
  findLatestByOrganisation(keycloakGroupId: string): Promise<WinLeadPlusSyncLogEntity | null>;
  findAll(filters?: { keycloakGroupId?: string; status?: WinLeadPlusSyncStatus }): Promise<WinLeadPlusSyncLogEntity[]>;
  findRunning(keycloakGroupId: string): Promise<WinLeadPlusSyncLogEntity | null>;
  save(entity: WinLeadPlusSyncLogEntity): Promise<WinLeadPlusSyncLogEntity>;
  create(input: { keycloakGroupId: string; startedAt: Date }): Promise<WinLeadPlusSyncLogEntity>;
  delete(id: string): Promise<void>;
}

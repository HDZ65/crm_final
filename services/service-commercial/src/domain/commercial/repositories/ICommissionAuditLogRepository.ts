import { CommissionAuditLogEntity } from '../entities/commission-audit-log.entity';

export interface ICommissionAuditLogRepository {
  findById(id: string): Promise<CommissionAuditLogEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    scope?: string;
    refId?: string;
    action?: string;
  }): Promise<CommissionAuditLogEntity[]>;
  save(entity: CommissionAuditLogEntity): Promise<CommissionAuditLogEntity>;
}

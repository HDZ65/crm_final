import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionAuditService } from './audit.service';
import { AuditAction, AuditScope } from './entities/commission-audit-log.entity';

import type {
  GetAuditLogsRequest,
  GetAuditLogsByRefRequest,
  GetByCommissionRequest,
  AuditLogListResponse,
} from '@crm/proto/commission';

const grpcToAuditScope = (n: number): AuditScope | undefined => {
  const map: Record<number, AuditScope> = {
    1: AuditScope.COMMISSION,
    2: AuditScope.RECURRENCE,
    3: AuditScope.REPRISE,
    4: AuditScope.REPORT,
    5: AuditScope.BORDEREAU,
    6: AuditScope.LIGNE,
    7: AuditScope.BAREME,
    8: AuditScope.PALIER,
    9: AuditScope.ENGINE,
  };
  return map[n];
};

const grpcToAuditAction = (n: number): AuditAction | undefined => {
  const map: Record<number, AuditAction> = {
    1: AuditAction.COMMISSION_CALCULATED,
    2: AuditAction.COMMISSION_CREATED,
    3: AuditAction.COMMISSION_UPDATED,
    4: AuditAction.COMMISSION_DELETED,
    5: AuditAction.COMMISSION_STATUS_CHANGED,
    6: AuditAction.RECURRENCE_GENERATED,
    7: AuditAction.RECURRENCE_STOPPED,
    8: AuditAction.REPRISE_CREATED,
    9: AuditAction.REPRISE_APPLIED,
    10: AuditAction.REPRISE_CANCELLED,
    11: AuditAction.REPRISE_REGULARIZED,
    12: AuditAction.REPORT_NEGATIF_CREATED,
    13: AuditAction.REPORT_NEGATIF_APPLIED,
    14: AuditAction.REPORT_NEGATIF_CLEARED,
    15: AuditAction.BORDEREAU_CREATED,
    16: AuditAction.BORDEREAU_VALIDATED,
    17: AuditAction.BORDEREAU_EXPORTED,
    18: AuditAction.BORDEREAU_ARCHIVED,
    19: AuditAction.LIGNE_SELECTED,
    20: AuditAction.LIGNE_DESELECTED,
    21: AuditAction.LIGNE_VALIDATED,
    22: AuditAction.LIGNE_REJECTED,
    23: AuditAction.BAREME_CREATED,
    24: AuditAction.BAREME_UPDATED,
    25: AuditAction.BAREME_ACTIVATED,
    26: AuditAction.BAREME_DEACTIVATED,
    27: AuditAction.BAREME_VERSION_CREATED,
    28: AuditAction.PALIER_CREATED,
    29: AuditAction.PALIER_UPDATED,
    30: AuditAction.PALIER_DELETED,
  };
  return map[n];
};

@Controller()
export class AuditController {
  constructor(private readonly service: CommissionAuditService) {}

  @GrpcMethod('CommissionService', 'GetAuditLogs')
  async list(req: GetAuditLogsRequest): Promise<AuditLogListResponse> {
    try {
      const { logs, total } = await this.service.findAll({
        organisationId: req.organisationId,
        scope: req.scope ? grpcToAuditScope(req.scope) : undefined,
        action: req.action ? grpcToAuditAction(req.action) : undefined,
        refId: req.refId,
        userId: req.userId,
        apporteurId: req.apporteurId,
        contratId: req.contratId,
        baremeId: req.baremeId,
        periode: req.periode,
        dateFrom: req.dateFrom ? new Date(req.dateFrom) : undefined,
        dateTo: req.dateTo ? new Date(req.dateTo) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { logs: logs as unknown as AuditLogListResponse['logs'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetAuditLogsByRef')
  async listByRef(req: GetAuditLogsByRefRequest): Promise<AuditLogListResponse> {
    try {
      const scope = grpcToAuditScope(req.scope);
      if (!scope) {
        throw new Error('Invalid scope');
      }
      const logs = await this.service.findByRef(req.organisationId, scope, req.refId);
      return { logs: logs as unknown as AuditLogListResponse['logs'], total: logs.length };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetAuditLogsByCommission')
  async listByCommission(req: GetByCommissionRequest): Promise<AuditLogListResponse> {
    try {
      const logs = await this.service.findByCommission('', req.commissionId);
      return { logs: logs as unknown as AuditLogListResponse['logs'], total: logs.length };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

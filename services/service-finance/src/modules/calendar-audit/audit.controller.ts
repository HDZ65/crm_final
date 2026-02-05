import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { parseISO } from 'date-fns';

import { CalendarAuditService } from './audit.service';
import { AuditSource } from './entities/calendar-audit-log.entity';
import { CsvImportService, ImportType } from '../csv-import/csv-import.service';

const protoToAuditSource = (n: number): AuditSource | undefined => {
  const map: Record<number, AuditSource> = {
    1: AuditSource.UI,
    2: AuditSource.CSV_IMPORT,
    3: AuditSource.API,
    4: AuditSource.SYSTEM,
  };
  return map[n];
};

@Controller()
export class CalendarAuditController {
  constructor(
    private readonly auditService: CalendarAuditService,
    private readonly csvImportService: CsvImportService,
  ) {}

  @GrpcMethod('CalendarAdminService', 'GetAuditLogs')
  async getAuditLogs(req: {
    organisationId: string;
    entityType?: string;
    entityId?: string;
    actorUserId?: string;
    source?: number;
    startDate?: string;
    endDate?: string;
    pagination?: { page: number; limit: number };
  }) {
    try {
      const page = req.pagination?.page ?? 1;
      const limit = req.pagination?.limit ?? 50;

      const result = await this.auditService.getAuditLogs({
        organisationId: req.organisationId,
        entityType: req.entityType,
        entityId: req.entityId,
        actorUserId: req.actorUserId,
        source: req.source ? protoToAuditSource(req.source) : undefined,
        fromDate: req.startDate ? parseISO(req.startDate) : undefined,
        toDate: req.endDate ? parseISO(req.endDate) : undefined,
        limit,
        offset: (page - 1) * limit,
      });

      return {
        logs: result.logs,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CalendarAdminService', 'ImportCsv')
  async importCsv(req: {
    organisationId: string;
    csvContent: Buffer;
    importType: string;
    dryRun: boolean;
    uploadedByUserId: string;
  }) {
    try {
      const importTypeMap: Record<string, ImportType> = {
        COMPANY_CONFIG: 'company_config',
        CLIENT_CONFIG: 'client_config',
        CONTRACT_CONFIG: 'contract_config',
        HOLIDAYS: 'holidays',
      };

      const mappedType = importTypeMap[req.importType];
      if (!mappedType) {
        return {
          importId: '',
          success: false,
          isDryRun: req.dryRun,
          totalRows: 0,
          validRows: 0,
          errorRows: 1,
          errors: [{ rowNumber: 0, columnName: '', value: '', errorCode: 'INVALID_TYPE', errorMessage: `Invalid import type: ${req.importType}` }],
          preview: [],
        };
      }

      const result = await this.csvImportService.importCsv(
        req.organisationId,
        mappedType,
        req.csvContent.toString('utf-8'),
        req.dryRun,
        req.uploadedByUserId,
      );

      return {
        importId: result.importId,
        success: result.errorRows === 0,
        isDryRun: result.isDryRun,
        totalRows: result.totalRows,
        validRows: result.validRows,
        errorRows: result.errorRows,
        errors: result.errors,
        preview: [],
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

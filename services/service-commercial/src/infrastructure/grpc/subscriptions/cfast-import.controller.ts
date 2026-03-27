import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  CfastImportService,
  ImportResult,
  ImportStatusResult,
} from '../../../domain/cfast/services/cfast-import.service';

function f(data: Record<string, any>, camel: string, snake: string): any {
  return data[camel] ?? data[snake];
}

@Controller()
export class CfastImportController {
  constructor(private readonly cfastImportService: CfastImportService) {}

  @GrpcMethod('CfastImportService', 'ImportInvoices')
  async importInvoices(data: Record<string, any>) {
    const organisationId = f(data, 'organisationId', 'organisation_id');
    if (!organisationId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    try {
      const result: ImportResult = await this.cfastImportService.importInvoices(organisationId);
      return {
        imported_count: result.importedCount,
        skipped_count: result.skippedCount,
        errors: result.errors,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = message.includes('config not found') ? status.NOT_FOUND : status.INTERNAL;
      throw new RpcException({ code, message });
    }
  }

  @GrpcMethod('CfastImportService', 'GetImportStatus')
  async getImportStatus(data: Record<string, any>) {
    const organisationId = f(data, 'organisationId', 'organisation_id');
    if (!organisationId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    try {
      const result: ImportStatusResult = await this.cfastImportService.getImportStatus(organisationId);
      return {
        status: result.status,
        imported_count: result.importedCount,
        skipped_count: result.skippedCount,
        errors: result.errors,
        last_sync_at: result.lastSyncAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = message.includes('config not found') ? status.NOT_FOUND : status.INTERNAL;
      throw new RpcException({ code, message });
    }
  }
}

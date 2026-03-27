import * as fs from 'node:fs';
import { status } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CatalogueAccountingExportService } from '../../../domain/products/services/catalogue-accounting-export.service';

@Controller()
export class AccountingExportController {
  private readonly logger = new Logger(AccountingExportController.name);

  constructor(private readonly exportService: CatalogueAccountingExportService) {}

  @GrpcMethod('AccountingExportService', 'GenerateExport')
  async generateExport(data: {
    keycloak_group_id: string;
    company_name: string;
    period: string;
    format: string;
    type_filter?: string[];
    generated_by?: string;
  }) {
    if (!data.keycloak_group_id || !data.period) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'keycloak_group_id et period sont requis' });
    }

    const fmt = (data.format === 'xlsx' ? 'xlsx' : 'csv') as 'csv' | 'xlsx';

    try {
      const result = await this.exportService.generateExport({
        keycloak_group_id: data.keycloak_group_id,
        company_name: data.company_name ?? data.keycloak_group_id,
        period: data.period,
        format: fmt,
        type_filter: data.type_filter as Array<'CA' | 'Commission' | 'Frais' | 'TVA'> | undefined,
        generated_by: data.generated_by ?? 'GATEWAY',
      });

      return {
        filename: result.filename,
        buffer: result.buffer,
        mime: result.mime,
        row_count: result.rowCount,
        file_hash: result.fileHash,
        log_id: result.logId,
      };
    } catch (err) {
      throw new RpcException({ code: status.INTERNAL, message: (err as Error).message });
    }
  }

  @GrpcMethod('AccountingExportService', 'ListExports')
  async listExports(data: { keycloak_group_id: string; period_from?: string; period_to?: string }) {
    const entries = await this.exportService.listExports(data.keycloak_group_id, data.period_from, data.period_to);

    return {
      exports: entries.map((e) => ({
        id: e.id,
        keycloak_group_id: e.keycloakGroupId,
        company_name: e.companyName,
        period: e.period,
        format: e.format,
        filename: e.filename,
        file_hash: e.fileHash,
        file_size_bytes: e.fileSizeBytes,
        row_count: e.rowCount,
        storage_path: e.storagePath ?? '',
        s3_url: e.s3Url ?? '',
        generated_by: e.generatedBy,
        generated_at: e.generatedAt.toISOString(),
      })),
    };
  }

  @GrpcMethod('AccountingExportService', 'GetExport')
  async getExport(data: { id: string }) {
    const entry = await this.exportService.getExportLog(data.id);
    if (!entry) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Export ${data.id} introuvable` });
    }
    return {
      id: entry.id,
      keycloak_group_id: entry.keycloakGroupId,
      company_name: entry.companyName,
      period: entry.period,
      format: entry.format,
      filename: entry.filename,
      file_hash: entry.fileHash,
      file_size_bytes: entry.fileSizeBytes,
      row_count: entry.rowCount,
      storage_path: entry.storagePath ?? '',
      s3_url: entry.s3Url ?? '',
      generated_by: entry.generatedBy,
      generated_at: entry.generatedAt.toISOString(),
    };
  }

  @GrpcMethod('AccountingExportService', 'DownloadExport')
  async downloadExport(data: { id: string }) {
    const entry = await this.exportService.getExportLog(data.id);
    if (!entry) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Export ${data.id} introuvable` });
    }

    // Serve from disk if available
    if (entry.storagePath) {
      try {
        const buffer = fs.readFileSync(entry.storagePath);
        const mime =
          entry.format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv; charset=utf-8';
        return {
          filename: entry.filename,
          buffer,
          mime,
          row_count: entry.rowCount,
          file_hash: entry.fileHash,
          log_id: entry.id,
        };
      } catch {
        this.logger.warn(`[DownloadExport] storagePath non lisible pour ${data.id} — régénération`);
      }
    }

    // Regenerate if file not on disk
    const result = await this.exportService.generateExport({
      keycloak_group_id: entry.keycloakGroupId,
      company_name: entry.companyName,
      period: entry.period,
      format: entry.format as 'csv' | 'xlsx',
      generated_by: 'DOWNLOAD_REGEN',
    });

    return {
      filename: result.filename,
      buffer: result.buffer,
      mime: result.mime,
      row_count: result.rowCount,
      file_hash: result.fileHash,
      log_id: entry.id,
    };
  }
}

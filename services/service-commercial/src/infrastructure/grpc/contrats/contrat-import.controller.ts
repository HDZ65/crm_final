import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  ContratImportService,
  type ImportResult,
} from '../../../domain/contrats/services/contrat-import.service';

interface ImportFromExternalRequest {
  organisation_id: string;
  source_url: string;
  api_key: string;
  dry_run: boolean;
}

interface GetImportStatusRequest {
  import_id: string;
}

@Controller()
export class ContratImportController {
  private readonly logger = new Logger(ContratImportController.name);

  constructor(
    private readonly contratImportService: ContratImportService,
  ) {}

  @GrpcMethod('ContratImportService', 'ImportFromExternal')
  async importFromExternal(data: ImportFromExternalRequest) {
    this.logger.log(
      `ImportFromExternal: org=${data.organisation_id}, url=${data.source_url}, dry_run=${data.dry_run}`,
    );

    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    if (!data.source_url) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'source_url is required',
      });
    }

    if (!data.api_key) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'api_key is required',
      });
    }

    try {
      const result: ImportResult =
        await this.contratImportService.importFromExternal({
          organisationId: data.organisation_id,
          sourceUrl: data.source_url,
          apiKey: data.api_key,
          dryRun: data.dry_run ?? false,
        });

      return {
        import_id: result.importId,
        total_rows: result.totalRows,
        created_count: result.createdCount,
        updated_count: result.updatedCount,
        skipped_count: result.skippedCount,
        errors: result.errors.map((e) => ({
          row: e.row,
          reference: e.reference,
          error_message: e.errorMessage,
        })),
      };
    } catch (err) {
      this.logger.error(
        `ImportFromExternal failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new RpcException({
        code: status.INTERNAL,
        message: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  @GrpcMethod('ContratImportService', 'GetImportStatus')
  async getImportStatus(data: GetImportStatusRequest) {
    if (!data.import_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'import_id is required',
      });
    }

    const importStatus = this.contratImportService.getImportStatus(
      data.import_id,
    );

    if (!importStatus) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Import ${data.import_id} not found`,
      });
    }

    return {
      import_id: importStatus.importId,
      status: importStatus.status,
      total_rows: importStatus.totalRows,
      processed_rows: importStatus.processedRows,
      created_count: importStatus.createdCount,
      updated_count: importStatus.updatedCount,
      skipped_count: importStatus.skippedCount,
      errors: importStatus.errors.map((e) => ({
        row: e.row,
        reference: e.reference,
        error_message: e.errorMessage,
      })),
    };
  }
}

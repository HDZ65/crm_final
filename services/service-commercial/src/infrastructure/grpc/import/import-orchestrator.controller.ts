import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  ImportOrchestratorService,
  type ImportResult,
} from '../../../domain/import/services/import-orchestrator.service';

interface ImportAllRequest {
  organisation_id: string;
  api_url: string;
  api_key: string;
  dry_run?: boolean;
  page_size?: number;
}

@Controller()
export class ImportOrchestratorController {
  private readonly logger = new Logger(ImportOrchestratorController.name);

  constructor(private readonly orchestrator: ImportOrchestratorService) {}

  @GrpcMethod('ImportOrchestratorService', 'ImportAll')
  async importAll(data: ImportAllRequest) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    if (!data.api_url) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'api_url is required',
      });
    }

    if (!data.api_key) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'api_key is required',
      });
    }

    this.logger.log(
      `ImportAll started: org=${data.organisation_id}, url=${data.api_url}, dry_run=${Boolean(data.dry_run)}`,
    );

    try {
      const result: ImportResult = await this.orchestrator.importAll({
        organisationId: data.organisation_id,
        apiUrl: data.api_url,
        apiKey: data.api_key,
        dryRun: Boolean(data.dry_run),
        pageSize: data.page_size,
      });

      return {
        total: result.total,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.map((item) => ({
          prospect_external_id: item.prospectExternalId,
          message: item.message,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`ImportAll failed: ${message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: `ImportAll failed: ${message}`,
      });
    }
  }
}

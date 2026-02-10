import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ExportService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/export.service';
import { ExportFormat } from '../../../../domain/payments/entities/export-job.entity';

/**
 * Export gRPC Controller — Accounting export operations.
 *
 * Implements 4 RPCs from PaymentService:
 *   - CreateExportJob
 *   - GetExportJob
 *   - ListExportJobs
 *   - DownloadExport (returns signed URL)
 */
@Controller()
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  /**
   * Create a new accounting export job.
   * Proto: CreateExportJob(CreateExportJobRequest) returns (ExportJobResponse)
   */
  @GrpcMethod('PaymentService', 'CreateExportJob')
  async createExportJob(data: {
    societe_id: string;
    export_type: string;
    from_date: string;
    to_date: string;
    format?: string;
    filters?: string;
    metadata?: Record<string, string>;
  }) {
    this.logger.log(
      `CreateExportJob: company=${data.societe_id}, type=${data.export_type}, ` +
      `period=${data.from_date} → ${data.to_date}, format=${data.format ?? 'CSV'}`,
    );

    const format = this.mapFormat(data.format);

    const job = await this.exportService.createExportJob({
      companyId: data.societe_id,
      periodFrom: new Date(data.from_date),
      periodTo: new Date(data.to_date),
      format,
      createdBy: data.metadata?.created_by ?? undefined,
    });

    return this.mapJobToResponse(job);
  }

  /**
   * Get a single export job by ID.
   * Proto: GetExportJob(GetExportJobRequest) returns (ExportJobResponse)
   */
  @GrpcMethod('PaymentService', 'GetExportJob')
  async getExportJob(data: { id: string; societe_id: string }) {
    this.logger.debug(`GetExportJob: id=${data.id}, company=${data.societe_id}`);

    const job = await this.exportService.getExportJob(data.id);
    if (!job) {
      throw new Error(`Export job ${data.id} not found`);
    }

    return this.mapJobToResponse(job);
  }

  /**
   * List export jobs for a company with pagination.
   * Proto: ListExportJobs(ListExportJobsRequest) returns (ListExportJobsResponse)
   */
  @GrpcMethod('PaymentService', 'ListExportJobs')
  async listExportJobs(data: {
    societe_id: string;
    export_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) {
    this.logger.debug(`ListExportJobs: company=${data.societe_id}, page=${data.page ?? 1}`);

    const result = await this.exportService.listExportJobs(
      data.societe_id,
      data.page ?? 1,
      data.page_size ?? 20,
    );

    return {
      jobs: result.items.map((job) => this.mapJobToResponse(job)),
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
    };
  }

  /**
   * Download an export — returns a signed URL (not file content).
   * Proto: DownloadExport(DownloadExportRequest) returns (DownloadExportResponse)
   *
   * Per Annexe J.4: download via signed URL valid 24h.
   * Returns URL in file_name field and content_type for client guidance.
   */
  @GrpcMethod('PaymentService', 'DownloadExport')
  async downloadExport(data: { id: string; societe_id: string }) {
    this.logger.log(`DownloadExport: id=${data.id}, company=${data.societe_id}`);

    const { url, expiresAt } = await this.exportService.getDownloadUrl(data.id);

    return {
      file_content: Buffer.alloc(0), // No inline content — use signed URL
      file_name: url,
      content_type: 'application/gzip',
      file_size_bytes: 0,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private mapFormat(format?: string): ExportFormat {
    if (!format) return ExportFormat.CSV;
    switch (format.toUpperCase()) {
      case 'XLSX':
        return ExportFormat.XLSX;
      case 'JSON':
        return ExportFormat.JSON;
      case 'CSV':
      default:
        return ExportFormat.CSV;
    }
  }

  private mapJobToResponse(job: {
    id: string;
    companyId: string;
    format: string;
    status: string;
    periodFrom: Date;
    periodTo: Date;
    fileId: string | null;
    durationMs: number | null;
    createdAt: Date;
  }) {
    return {
      id: job.id,
      societe_id: job.companyId,
      export_type: 'CSV_ACCOUNTING',
      status: this.mapStatus(job.status),
      from_date: job.periodFrom instanceof Date
        ? job.periodFrom.toISOString().split('T')[0]
        : String(job.periodFrom),
      to_date: job.periodTo instanceof Date
        ? job.periodTo.toISOString().split('T')[0]
        : String(job.periodTo),
      format: job.format,
      file_url: job.fileId ? `/api/payments/exports/${job.id}/download` : undefined,
      file_name: job.fileId ? `export_${job.id}.${job.format.toLowerCase()}.gz` : undefined,
      file_size_bytes: 0,
      record_count: 0,
      error_message: undefined,
      created_at: job.createdAt.toISOString(),
      completed_at: job.durationMs != null ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Map internal status enum to proto status string.
   */
  private mapStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'PENDING';
      case 'RUNNING':
        return 'PROCESSING';
      case 'DONE':
        return 'COMPLETED';
      case 'FAILED':
        return 'FAILED';
      default:
        return status;
    }
  }
}

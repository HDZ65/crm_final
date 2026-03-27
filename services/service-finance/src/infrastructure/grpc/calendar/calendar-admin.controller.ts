import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import * as grpc from '@grpc/grpc-js';
import { CalendarAdminService } from '../../persistence/typeorm/repositories/calendar/calendar-admin.service';
import {
  PlannedDebitEntity,
  PlannedDateStatus,
  DebitBatch as DomainDebitBatch,
  CalendarAuditLogEntity,
  CalendarAuditSource,
  VolumeThresholdEntity,
} from '../../../domain/calendar/entities';
import {
  GetCalendarViewRequest,
  GetDateDetailsRequest,
  GetVolumeHeatmapRequest,
  ImportCsvRequest,
  ConfirmCsvImportRequest,
  ExportCalendarCsvRequest,
  CreateVolumeThresholdRequest,
  UpdateVolumeThresholdRequest,
  GetVolumeThresholdRequest,
  ListVolumeThresholdsRequest,
  DeleteVolumeThresholdRequest,
  GetAuditLogsRequest,
  DebitBatch as ProtoDebitBatch,
  PlannedDateStatus as ProtoPlannedDateStatus,
  AuditSource as ProtoAuditSource,
} from '@proto/calendar';

@Controller()
export class CalendarAdminController {
  constructor(private readonly calendarAdminService: CalendarAdminService) {}

  // =========================================================================
  // GetCalendarView
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'GetCalendarView')
  async getCalendarView(data: GetCalendarViewRequest) {
    const batches = (data.batches || []).map((b) => this.protoBatchToDomain(b));
    const statuses = (data.statuses || []).map((s) => this.protoStatusToDomain(s));

    const result = await this.calendarAdminService.getCalendarView(
      data.organisation_id,
      data.start_date,
      data.end_date,
      data.societe_ids || [],
      batches,
      statuses,
      data.include_volumes || false,
    );

    return {
      days: result.days.map((day) => ({
        date: day.date,
        is_weekend: day.isWeekend,
        is_holiday: day.isHoliday,
        holiday_name: day.holidayName,
        is_eligible: day.isEligible,
        debits: day.debits.map((d) => this.mapPlannedDebitSummary(d)),
      })),
      volumes: result.volumes,
    };
  }

  // =========================================================================
  // GetDateDetails
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'GetDateDetails')
  async getDateDetails(data: GetDateDetailsRequest) {
    const batch = data.batch ? this.protoBatchToDomain(data.batch) : null;

    const result = await this.calendarAdminService.getDateDetails(
      data.organisation_id,
      data.date,
      data.societe_id || '',
      batch,
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sort_by,
        sortOrder: data.pagination?.sort_order,
      },
    );

    return {
      debits: result.debits.map((d) => this.mapPlannedDebit(d)),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
      aggregate: {
        date: result.aggregate.date,
        batch: ProtoDebitBatch.DEBIT_BATCH_UNSPECIFIED,
        societe_id: '',
        transaction_count: result.aggregate.transactionCount,
        total_amount_cents: result.aggregate.totalAmountCents,
        currency: result.aggregate.currency,
      },
    };
  }

  // =========================================================================
  // GetVolumeHeatmap
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'GetVolumeHeatmap')
  async getVolumeHeatmap(data: GetVolumeHeatmapRequest) {
    const batches = (data.batches || []).map((b) => this.protoBatchToDomain(b));

    const result = await this.calendarAdminService.getVolumeHeatmap(
      data.organisation_id,
      data.year,
      data.month || 0,
      data.societe_ids || [],
      batches,
      data.include_forecast || false,
    );

    return {
      cells: result.cells.map((c) => ({
        date: c.date,
        day_of_week: c.dayOfWeek,
        week_of_month: c.weekOfMonth,
        transaction_count: c.transactionCount,
        total_amount_cents: c.totalAmountCents,
        currency: c.currency,
        intensity_level: c.intensityLevel,
        exceeds_threshold: c.exceedsThreshold,
        forecast: undefined,
      })),
      exceeded_thresholds: result.exceededThresholds.map((t) => this.mapVolumeThreshold(t)),
    };
  }

  // =========================================================================
  // ImportCsv
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'ImportCsv')
  async importCsv(data: ImportCsvRequest) {
    const result = await this.calendarAdminService.importCsv(
      data.organisation_id,
      data.csv_content,
      data.import_type,
      data.dry_run,
      data.uploaded_by_user_id,
    );

    return {
      import_id: result.importId,
      success: result.success,
      is_dry_run: result.isDryRun,
      total_rows: result.totalRows,
      valid_rows: result.validRows,
      error_rows: result.errorRows,
      errors: result.errors,
      preview: result.preview,
    };
  }

  // =========================================================================
  // ConfirmCsvImport
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'ConfirmCsvImport')
  async confirmCsvImport(data: ConfirmCsvImportRequest) {
    const result = await this.calendarAdminService.confirmCsvImport(
      data.import_id,
      data.organisation_id,
      data.confirmed_by_user_id,
    );

    return {
      success: result.success,
      created_count: result.createdCount,
      updated_count: result.updatedCount,
      skipped_count: result.skippedCount,
      audit_log_id: result.auditLogId,
    };
  }

  // =========================================================================
  // ExportCalendarCsv
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'ExportCalendarCsv')
  async exportCalendarCsv(data: ExportCalendarCsvRequest) {
    const batches = (data.batches || []).map((b) => this.protoBatchToDomain(b));

    const result = await this.calendarAdminService.exportCalendarCsv(
      data.organisation_id,
      data.start_date,
      data.end_date,
      data.societe_ids || [],
      batches,
      data.export_type || 'PLANNED_DEBITS',
    );

    return {
      csv_content: result.csvContent,
      filename: result.filename,
      row_count: result.rowCount,
    };
  }

  // =========================================================================
  // VolumeThreshold CRUD
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'CreateVolumeThreshold')
  async createVolumeThreshold(data: CreateVolumeThresholdRequest) {
    const entity = await this.calendarAdminService.createVolumeThreshold({
      organisationId: data.organisation_id,
      societeId: data.societe_id || undefined,
      maxTransactionCount: data.max_transaction_count,
      maxAmountCents: data.max_amount_cents,
      currency: data.currency || 'EUR',
      alertOnExceed: data.alert_on_exceed ?? true,
      alertEmail: data.alert_email || undefined,
    });
    return this.mapVolumeThreshold(entity);
  }

  @GrpcMethod('CalendarAdminService', 'UpdateVolumeThreshold')
  async updateVolumeThreshold(data: UpdateVolumeThresholdRequest) {
    const entity = await this.calendarAdminService.updateVolumeThreshold(data.id, {
      maxTransactionCount: data.max_transaction_count,
      maxAmountCents: data.max_amount_cents,
      currency: data.currency || 'EUR',
      alertOnExceed: data.alert_on_exceed ?? true,
      alertEmail: data.alert_email || undefined,
      isActive: data.is_active ?? true,
    });
    return this.mapVolumeThreshold(entity);
  }

  @GrpcMethod('CalendarAdminService', 'GetVolumeThreshold')
  async getVolumeThreshold(data: GetVolumeThresholdRequest) {
    const entity = await this.calendarAdminService.getVolumeThreshold(data.id);
    return this.mapVolumeThreshold(entity);
  }

  @GrpcMethod('CalendarAdminService', 'ListVolumeThresholds')
  async listVolumeThresholds(data: ListVolumeThresholdsRequest) {
    const result = await this.calendarAdminService.listVolumeThresholds(
      data.organisation_id,
      data.societe_id || '',
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sort_by,
        sortOrder: data.pagination?.sort_order,
      },
    );

    return {
      thresholds: result.thresholds.map((t) => this.mapVolumeThreshold(t)),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('CalendarAdminService', 'DeleteVolumeThreshold')
  async deleteVolumeThreshold(data: DeleteVolumeThresholdRequest) {
    return this.calendarAdminService.deleteVolumeThreshold(data.id);
  }

  // =========================================================================
  // Audit
  // =========================================================================

  @GrpcMethod('CalendarAdminService', 'GetAuditLogs')
  async getAuditLogs(data: GetAuditLogsRequest) {
    const result = await this.calendarAdminService.getAuditLogs(
      data.organisation_id,
      {
        entityType: data.entity_type || undefined,
        entityId: data.entity_id || undefined,
        actorUserId: data.actor_user_id || undefined,
        source: data.source || undefined,
        startDate: data.start_date || undefined,
        endDate: data.end_date || undefined,
      },
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sort_by,
        sortOrder: data.pagination?.sort_order,
      },
    );

    return {
      logs: result.logs.map((log) => this.mapAuditLog(log)),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  // =========================================================================
  // Private mapping helpers
  // =========================================================================

  private mapPlannedDebitSummary(d: PlannedDebitEntity) {
    return {
      id: d.id,
      contrat_id: d.contratId,
      client_name: d.clientId, // clientId used as name placeholder
      amount_cents: Number(d.amountCents),
      currency: d.currency,
      status: this.domainStatusToProto(d.status),
      batch: this.domainBatchToProto(d.batch),
    };
  }

  private mapPlannedDebit(d: PlannedDebitEntity) {
    const dateStr = (v: Date | string) =>
      typeof v === 'string' ? v : v?.toISOString?.().split('T')[0] || '';
    return {
      id: d.id,
      organisation_id: d.organisationId,
      societe_id: d.societeId,
      client_id: d.clientId,
      contrat_id: d.contratId,
      schedule_id: d.scheduleId || '',
      facture_id: d.factureId || '',
      planned_debit_date: dateStr(d.plannedDebitDate),
      original_target_date: dateStr(d.originalTargetDate),
      status: this.domainStatusToProto(d.status),
      batch: this.domainBatchToProto(d.batch),
      amount_cents: Number(d.amountCents),
      currency: d.currency,
      resolved_config: undefined,
      created_at: d.createdAt?.toISOString?.() || '',
      updated_at: d.updatedAt?.toISOString?.() || '',
    };
  }

  private mapVolumeThreshold(t: VolumeThresholdEntity) {
    return {
      id: t.id,
      organisation_id: t.organisationId,
      societe_id: t.societeId || '',
      max_transaction_count: t.maxTransactionCount || 0,
      max_amount_cents: Number(t.maxAmountCents) || 0,
      currency: t.currency,
      alert_on_exceed: t.alertOnExceed,
      alert_email: t.alertEmail || '',
      is_active: t.isActive,
      created_at: t.createdAt?.toISOString?.() || '',
      updated_at: t.updatedAt?.toISOString?.() || '',
    };
  }

  private mapAuditLog(log: CalendarAuditLogEntity) {
    return {
      id: log.id,
      organisation_id: log.organisationId,
      entity_type: log.entityType,
      entity_id: log.entityId,
      action: log.action,
      actor_user_id: log.actorUserId || '',
      source: this.domainAuditSourceToProto(log.source),
      before_state: log.beforeState ? JSON.stringify(log.beforeState) : '',
      after_state: log.afterState ? JSON.stringify(log.afterState) : '',
      change_summary: log.changeSummary || '',
      ip_address: log.ipAddress || '',
      user_agent: log.userAgent || '',
      created_at: log.createdAt?.toISOString?.() || '',
    };
  }

  // ---- Enum converters: Proto -> Domain ----

  private protoBatchToDomain(batch: ProtoDebitBatch): string {
    switch (batch) {
      case ProtoDebitBatch.DEBIT_BATCH_L1: return DomainDebitBatch.L1;
      case ProtoDebitBatch.DEBIT_BATCH_L2: return DomainDebitBatch.L2;
      case ProtoDebitBatch.DEBIT_BATCH_L3: return DomainDebitBatch.L3;
      case ProtoDebitBatch.DEBIT_BATCH_L4: return DomainDebitBatch.L4;
      default: return '';
    }
  }

  private protoStatusToDomain(status: ProtoPlannedDateStatus): string {
    switch (status) {
      case ProtoPlannedDateStatus.PLANNED_DATE_STATUS_PLANNED: return PlannedDateStatus.PLANNED;
      case ProtoPlannedDateStatus.PLANNED_DATE_STATUS_CONFIRMED: return PlannedDateStatus.CONFIRMED;
      case ProtoPlannedDateStatus.PLANNED_DATE_STATUS_PROCESSING: return PlannedDateStatus.PROCESSING;
      case ProtoPlannedDateStatus.PLANNED_DATE_STATUS_EXECUTED: return PlannedDateStatus.EXECUTED;
      case ProtoPlannedDateStatus.PLANNED_DATE_STATUS_FAILED: return PlannedDateStatus.FAILED;
      case ProtoPlannedDateStatus.PLANNED_DATE_STATUS_CANCELLED: return PlannedDateStatus.CANCELLED;
      default: return '';
    }
  }

  // ---- Enum converters: Domain -> Proto ----

  private domainBatchToProto(batch: DomainDebitBatch): ProtoDebitBatch {
    switch (batch) {
      case DomainDebitBatch.L1: return ProtoDebitBatch.DEBIT_BATCH_L1;
      case DomainDebitBatch.L2: return ProtoDebitBatch.DEBIT_BATCH_L2;
      case DomainDebitBatch.L3: return ProtoDebitBatch.DEBIT_BATCH_L3;
      case DomainDebitBatch.L4: return ProtoDebitBatch.DEBIT_BATCH_L4;
      default: return ProtoDebitBatch.DEBIT_BATCH_UNSPECIFIED;
    }
  }

  private domainStatusToProto(status: PlannedDateStatus): ProtoPlannedDateStatus {
    switch (status) {
      case PlannedDateStatus.PLANNED: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_PLANNED;
      case PlannedDateStatus.CONFIRMED: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_CONFIRMED;
      case PlannedDateStatus.PROCESSING: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_PROCESSING;
      case PlannedDateStatus.EXECUTED: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_EXECUTED;
      case PlannedDateStatus.FAILED: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_FAILED;
      case PlannedDateStatus.CANCELLED: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_CANCELLED;
      default: return ProtoPlannedDateStatus.PLANNED_DATE_STATUS_UNSPECIFIED;
    }
  }

  private domainAuditSourceToProto(source: CalendarAuditSource): ProtoAuditSource {
    switch (source) {
      case CalendarAuditSource.UI: return ProtoAuditSource.AUDIT_SOURCE_UI;
      case CalendarAuditSource.CSV_IMPORT: return ProtoAuditSource.AUDIT_SOURCE_CSV_IMPORT;
      case CalendarAuditSource.API: return ProtoAuditSource.AUDIT_SOURCE_API;
      case CalendarAuditSource.SYSTEM: return ProtoAuditSource.AUDIT_SOURCE_SYSTEM;
      default: return ProtoAuditSource.AUDIT_SOURCE_UNSPECIFIED;
    }
  }
}

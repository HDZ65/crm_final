"use server";

import { calendarAdmin } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  CalendarDayDto,
  PlannedDebitSummaryDto,
  HeatmapCellDto,
  VolumeThresholdDto,
  CalendarAuditLogDto,
  CsvImportPreviewDto,
  CsvValidationErrorDto,
  ActionResult,
  PaginatedResult,
} from "@/types/calendar";

function mapPlannedDebitSummary(summary: {
  id: string;
  contratId: string;
  clientName: string;
  amountCents: number;
  currency: string;
  status: number;
  batch: number;
}): PlannedDebitSummaryDto {
  return {
    id: summary.id,
    contratId: summary.contratId,
    clientName: summary.clientName,
    amountCents: Number(summary.amountCents),
    currency: summary.currency,
    status: summary.status as number,
    batch: summary.batch as number,
  };
}

function mapCalendarDay(day: {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string;
  isEligible: boolean;
  debits: Array<{
    id: string;
    contratId: string;
    clientName: string;
    amountCents: number;
    currency: string;
    status: number;
    batch: number;
  }>;
}): CalendarDayDto {
  return {
    date: day.date,
    isWeekend: day.isWeekend,
    isHoliday: day.isHoliday,
    holidayName: day.holidayName || undefined,
    isEligible: day.isEligible,
    debits: day.debits.map(mapPlannedDebitSummary),
  };
}

function mapHeatmapCell(cell: {
  date: string;
  dayOfWeek: number;
  weekOfMonth: number;
  transactionCount: number;
  totalAmountCents: number;
  currency: string;
  intensityLevel: string;
  exceedsThreshold: boolean;
}): HeatmapCellDto {
  return {
    date: cell.date,
    dayOfWeek: cell.dayOfWeek,
    weekOfMonth: cell.weekOfMonth,
    transactionCount: cell.transactionCount,
    totalAmountCents: Number(cell.totalAmountCents),
    currency: cell.currency,
    intensityLevel: cell.intensityLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    exceedsThreshold: cell.exceedsThreshold,
  };
}

function mapVolumeThreshold(threshold: {
  id: string;
  organisationId: string;
  societeId: string;
  maxTransactionCount: number;
  maxAmountCents: number;
  currency: string;
  alertOnExceed: boolean;
  alertEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): VolumeThresholdDto {
  return {
    id: threshold.id,
    organisationId: threshold.organisationId,
    societeId: threshold.societeId || undefined,
    maxTransactionCount: threshold.maxTransactionCount,
    maxAmountCents: Number(threshold.maxAmountCents),
    currency: threshold.currency,
    alertOnExceed: threshold.alertOnExceed,
    alertEmail: threshold.alertEmail || undefined,
    isActive: threshold.isActive,
    createdAt: threshold.createdAt,
    updatedAt: threshold.updatedAt,
  };
}

function mapAuditLog(log: {
  id: string;
  organisationId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string;
  source: number;
  beforeState: string;
  afterState: string;
  changeSummary: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}): CalendarAuditLogDto {
  return {
    id: log.id,
    organisationId: log.organisationId,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    actorUserId: log.actorUserId,
    source: log.source as number,
    beforeState: log.beforeState || undefined,
    afterState: log.afterState || undefined,
    changeSummary: log.changeSummary,
    ipAddress: log.ipAddress || undefined,
    userAgent: log.userAgent || undefined,
    createdAt: log.createdAt,
  };
}

export async function getCalendarView(input: {
  organisationId: string;
  startDate: string;
  endDate: string;
  societeIds?: string[];
  batches?: number[];
  statuses?: number[];
  includeVolumes?: boolean;
}): Promise<ActionResult<{ days: CalendarDayDto[] }>> {
  try {
    const response = await calendarAdmin.getCalendarView({
      organisationId: input.organisationId,
      startDate: input.startDate,
      endDate: input.endDate,
      societeIds: input.societeIds || [],
      batches: input.batches || [],
      statuses: input.statuses || [],
      includeVolumes: input.includeVolumes || false,
    });
    return {
      data: {
        days: response.days.map(mapCalendarDay),
      },
      error: null,
    };
  } catch (err) {
    console.error("[getCalendarView] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du calendrier",
    };
  }
}

export async function getDateDetails(input: {
  organisationId: string;
  date: string;
  societeId?: string;
  batch?: number;
  page?: number;
  limit?: number;
}): Promise<
  ActionResult<{
    debits: PlannedDebitSummaryDto[];
    total: number;
    transactionCount: number;
    totalAmountCents: number;
  }>
> {
  try {
    const response = await calendarAdmin.getDateDetails({
      organisationId: input.organisationId,
      date: input.date,
      societeId: input.societeId || "",
      batch: input.batch || 0,
      pagination: {
        page: input.page || 1,
        limit: input.limit || 50,
        sortBy: "clientName",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        debits: response.debits.map((d) => ({
          id: d.id,
          contratId: d.contratId,
          clientName: d.clientId || "",
          amountCents: Number(d.amountCents),
          currency: d.currency,
          status: d.status as number,
          batch: d.batch as number,
        })),
        total: response.pagination?.total || response.debits.length,
        transactionCount: response.aggregate?.transactionCount || 0,
        totalAmountCents: Number(response.aggregate?.totalAmountCents || 0),
      },
      error: null,
    };
  } catch (err) {
    console.error("[getDateDetails] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des détails de la date",
    };
  }
}

export async function getVolumeHeatmap(input: {
  organisationId: string;
  year: number;
  month?: number;
  societeIds?: string[];
  batches?: number[];
  includeForecast?: boolean;
}): Promise<ActionResult<{ cells: HeatmapCellDto[]; exceededThresholds: VolumeThresholdDto[] }>> {
  try {
    const response = await calendarAdmin.getVolumeHeatmap({
      organisationId: input.organisationId,
      year: input.year,
      month: input.month || 0,
      societeIds: input.societeIds || [],
      batches: input.batches || [],
      includeForecast: input.includeForecast || false,
    });
    return {
      data: {
        cells: response.cells.map(mapHeatmapCell),
        exceededThresholds: response.exceededThresholds.map(mapVolumeThreshold),
      },
      error: null,
    };
  } catch (err) {
    console.error("[getVolumeHeatmap] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la heatmap",
    };
  }
}

export async function importCsv(input: {
  organisationId: string;
  csvContent: Uint8Array;
  importType: string;
  dryRun: boolean;
  uploadedByUserId: string;
}): Promise<
  ActionResult<{
    importId: string;
    success: boolean;
    isDryRun: boolean;
    totalRows: number;
    validRows: number;
    errorRows: number;
    errors: CsvValidationErrorDto[];
    preview: CsvImportPreviewDto[];
  }>
> {
  try {
    const response = await calendarAdmin.importCsv({
      organisationId: input.organisationId,
      csvContent: input.csvContent,
      importType: input.importType,
      dryRun: input.dryRun,
      uploadedByUserId: input.uploadedByUserId,
    });
    return {
      data: {
        importId: response.importId,
        success: response.success,
        isDryRun: response.isDryRun,
        totalRows: response.totalRows,
        validRows: response.validRows,
        errorRows: response.errorRows,
        errors: response.errors.map((e) => ({
          rowNumber: e.rowNumber,
          columnName: e.columnName,
          value: e.value,
          errorCode: e.errorCode,
          errorMessage: e.errorMessage,
        })),
        preview: response.preview.map((p) => ({
          rowNumber: p.rowNumber,
          action: p.action as "CREATE" | "UPDATE" | "SKIP",
          entityType: p.entityType,
          entityId: p.entityId || undefined,
          data: Object.fromEntries(Object.entries(p.data || {})),
          changeSummary: p.changeSummary,
        })),
      },
      error: null,
    };
  } catch (err) {
    console.error("[importCsv] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'import CSV",
    };
  }
}

export async function confirmCsvImport(input: {
  importId: string;
  organisationId: string;
  confirmedByUserId: string;
}): Promise<
  ActionResult<{
    success: boolean;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    auditLogId: string;
  }>
> {
  try {
    const response = await calendarAdmin.confirmCsvImport({
      importId: input.importId,
      organisationId: input.organisationId,
      confirmedByUserId: input.confirmedByUserId,
    });
    revalidatePath("/calendrier");
    return {
      data: {
        success: response.success,
        createdCount: response.createdCount,
        updatedCount: response.updatedCount,
        skippedCount: response.skippedCount,
        auditLogId: response.auditLogId,
      },
      error: null,
    };
  } catch (err) {
    console.error("[confirmCsvImport] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la confirmation de l'import",
    };
  }
}

export async function exportCalendarCsv(input: {
  organisationId: string;
  startDate: string;
  endDate: string;
  societeIds?: string[];
  batches?: number[];
  exportType: string;
}): Promise<ActionResult<{ csvContent: Uint8Array; filename: string; rowCount: number }>> {
  try {
    const response = await calendarAdmin.exportCalendarCsv({
      organisationId: input.organisationId,
      startDate: input.startDate,
      endDate: input.endDate,
      societeIds: input.societeIds || [],
      batches: input.batches || [],
      exportType: input.exportType,
    });
    return {
      data: {
        csvContent: response.csvContent,
        filename: response.filename,
        rowCount: response.rowCount,
      },
      error: null,
    };
  } catch (err) {
    console.error("[exportCalendarCsv] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'export CSV",
    };
  }
}

export async function listVolumeThresholds(input: {
  organisationId: string;
  societeId?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<VolumeThresholdDto>>> {
  try {
    const response = await calendarAdmin.listVolumeThresholds({
      organisationId: input.organisationId,
      societeId: input.societeId || "",
      pagination: {
        page: input.page || 1,
        limit: input.limit || 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: response.thresholds.map(mapVolumeThreshold),
        total: response.pagination?.total || response.thresholds.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listVolumeThresholds] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des seuils de volume",
    };
  }
}

export async function getVolumeThreshold(
  id: string
): Promise<ActionResult<VolumeThresholdDto>> {
  try {
    const response = await calendarAdmin.getVolumeThreshold({ id });
    return { data: mapVolumeThreshold(response), error: null };
  } catch (err) {
    console.error("[getVolumeThreshold] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du seuil de volume",
    };
  }
}

export async function createVolumeThreshold(input: {
  organisationId: string;
  societeId?: string;
  maxTransactionCount: number;
  maxAmountCents: number;
  currency: string;
  alertOnExceed: boolean;
  alertEmail?: string;
}): Promise<ActionResult<VolumeThresholdDto>> {
  try {
    const response = await calendarAdmin.createVolumeThreshold({
      organisationId: input.organisationId,
      societeId: input.societeId || "",
      maxTransactionCount: input.maxTransactionCount,
      maxAmountCents: input.maxAmountCents,
      currency: input.currency,
      alertOnExceed: input.alertOnExceed,
      alertEmail: input.alertEmail || "",
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapVolumeThreshold(response), error: null };
  } catch (err) {
    console.error("[createVolumeThreshold] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du seuil de volume",
    };
  }
}

export async function updateVolumeThreshold(input: {
  id: string;
  maxTransactionCount: number;
  maxAmountCents: number;
  currency: string;
  alertOnExceed: boolean;
  alertEmail?: string;
  isActive: boolean;
}): Promise<ActionResult<VolumeThresholdDto>> {
  try {
    const response = await calendarAdmin.updateVolumeThreshold({
      id: input.id,
      maxTransactionCount: input.maxTransactionCount,
      maxAmountCents: input.maxAmountCents,
      currency: input.currency,
      alertOnExceed: input.alertOnExceed,
      alertEmail: input.alertEmail || "",
      isActive: input.isActive,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapVolumeThreshold(response), error: null };
  } catch (err) {
    console.error("[updateVolumeThreshold] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du seuil de volume",
    };
  }
}

export async function deleteVolumeThreshold(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await calendarAdmin.deleteVolumeThreshold({ id });
    revalidatePath("/calendrier/configurations");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteVolumeThreshold] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du seuil de volume",
    };
  }
}

export async function getAuditLogs(input: {
  organisationId: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  source?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<CalendarAuditLogDto>>> {
  try {
    const response = await calendarAdmin.getAuditLogs({
      organisationId: input.organisationId,
      entityType: input.entityType || "",
      entityId: input.entityId || "",
      actorUserId: input.actorUserId || "",
      source: input.source || 0,
      startDate: input.startDate || "",
      endDate: input.endDate || "",
      pagination: {
        page: input.page || 1,
        limit: input.limit || 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: response.logs.map(mapAuditLog),
        total: response.pagination?.total || response.logs.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 50,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getAuditLogs] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des logs d'audit",
    };
  }
}

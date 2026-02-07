"use server";

import { payments } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  CreateExportJobRequest,
  ExportJobResponse,
  ListExportJobsRequest,
  ListExportJobsResponse,
  DownloadExportResponse,
} from "@proto/payments/payment";
import type { ActionResult } from "@/lib/types/common";

// ==================== ACCOUNTING EXPORTS ====================

/**
 * Create an export job via gRPC
 */
export async function createExportJob(
  request: CreateExportJobRequest
): Promise<ActionResult<ExportJobResponse>> {
  try {
    const data = await payments.createExportJob(request);
    revalidatePath("/payments/exports");
    return { data, error: null };
  } catch (err) {
    console.error("[createExportJob] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'export",
    };
  }
}

/**
 * Get an export job by ID via gRPC
 */
export async function getExportJob(
  id: string,
  societeId: string
): Promise<ActionResult<ExportJobResponse>> {
  try {
    const data = await payments.getExportJob({ id, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getExportJob] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de l'export",
    };
  }
}

/**
 * List export jobs via gRPC
 */
export async function listExportJobs(
  request: ListExportJobsRequest
): Promise<ActionResult<ListExportJobsResponse>> {
  try {
    const data = await payments.listExportJobs(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listExportJobs] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des exports",
    };
  }
}

/**
 * Download an export file via gRPC
 */
export async function downloadExport(
  id: string,
  societeId: string
): Promise<ActionResult<DownloadExportResponse>> {
  try {
    const data = await payments.downloadExport({ id, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[downloadExport] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du téléchargement de l'export",
    };
  }
}

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
    revalidatePath("/paiements");
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

// ============================================================================
// Journal + FEC exports (REST gateway)
// ============================================================================

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:3405";

export async function generateJournal(params: {
  societeId: string;
  journalType: "VENTES" | "REGLEMENTS" | "IMPAYES";
  periodFrom: string;
  periodTo: string;
  format: "CSV" | "FEC";
}): Promise<ActionResult<{ content: string; filename: string; mimeType: string }>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/payments/exports/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: errText || `Erreur ${res.status}` };
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const ext = params.format === "FEC" ? "txt" : "csv";
    const filename = `journal-${params.journalType.toLowerCase()}-${params.periodFrom}-${params.periodTo}.${ext}`;
    const mimeType = params.format === "FEC" ? "text/plain" : "text/csv";
    return { data: { content: base64, filename, mimeType }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function generateFec(params: {
  societeId: string;
  siren: string;
  dateCloture: string;
}): Promise<ActionResult<{ content: string; filename: string }>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/payments/exports/fec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: errText || `Erreur ${res.status}` };
    }
    const result = await res.json();
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
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

"use server";

import { revalidatePath } from "next/cache";
import { winleadplus } from "@/lib/grpc";
import type { ActionResult } from "@/lib/types/common";
import type {
  SyncProspectsResponse,
  GetSyncStatusResponse,
  ListWinLeadPlusSyncLogsResponse,
} from "@proto/winleadplus/winleadplus";
import type { TestConnectionResponse } from "@/lib/grpc/clients/winleadplus";

// ============================================================================
// WinLeadPlus Sync Actions
// ============================================================================

/**
 * Trigger a sync of WinLeadPlus prospects
 */
export async function syncWinLeadPlusProspects(params: {
  organisationId: string;
  dryRun?: boolean;
}): Promise<ActionResult<SyncProspectsResponse>> {
  try {
    const data = await winleadplus.syncProspects({
      organisationId: params.organisationId,
      dryRun: params.dryRun || false,
    });
    if (!params.dryRun) {
      revalidatePath("/clients");
    }
    return { data, error: null };
  } catch (err) {
    console.error("[syncWinLeadPlusProspects] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la synchronisation WinLeadPlus",
    };
  }
}

/**
 * Get the current sync status for an organisation
 */
export async function getWinLeadPlusSyncStatus(params: {
  organisationId: string;
}): Promise<ActionResult<GetSyncStatusResponse>> {
  try {
    const data = await winleadplus.getSyncStatus({
      organisationId: params.organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getWinLeadPlusSyncStatus] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du statut de synchronisation",
    };
  }
}

/**
 * Get recent sync logs for an organisation
 */
export async function getWinLeadPlusSyncLogs(params: {
  organisationId: string;
  limit?: number;
}): Promise<ActionResult<ListWinLeadPlusSyncLogsResponse>> {
  try {
    const data = await winleadplus.getSyncLogs({
      organisationId: params.organisationId,
      limit: params.limit || 10,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getWinLeadPlusSyncLogs] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération des logs de synchronisation",
    };
  }
}

/**
 * Test WinLeadPlus API connectivity
 */
export async function testWinLeadPlusConnection(params: {
  organisationId: string;
  apiEndpoint: string;
}): Promise<ActionResult<TestConnectionResponse>> {
  try {
    const data = await winleadplus.testConnection({
      organisationId: params.organisationId,
      apiEndpoint: params.apiEndpoint,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[testWinLeadPlusConnection] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du test de connexion WinLeadPlus",
    };
  }
}

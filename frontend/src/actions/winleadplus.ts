"use server";

import { revalidatePath } from "next/cache";
import { winleadplus } from "@/lib/grpc";
import type { ActionResult } from "@/lib/types/common";
import type {
  SyncProspectsResponse,
  GetSyncStatusResponse,
  ListWinLeadPlusSyncLogsResponse,
  WinLeadPlusConfig,
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
      organisation_id: params.organisationId,
      dry_run: params.dryRun || false,
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
      organisation_id: params.organisationId,
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
      organisation_id: params.organisationId,
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
       organisation_id: params.organisationId,
       api_endpoint: params.apiEndpoint,
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

/**
 * Check if organisation has an active WinLeadPlus config
 */
export async function hasWinLeadPlusConfig(params: {
    organisationId: string;
  }): Promise<boolean> {
    try {
      const data = await winleadplus.hasConfig({
        organisation_id: params.organisationId,
      });
      return data.enabled ?? false;
    } catch {
      return false; // Fail closed
    }
  }

/**
 * Get WinLeadPlus configuration for an organisation
 */
export async function getWinLeadPlusConfig(params: {
  organisationId: string;
}): Promise<ActionResult<WinLeadPlusConfig>> {
  try {
    const data = await winleadplus.getConfig({
      organisation_id: params.organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getWinLeadPlusConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération de la configuration WinLeadPlus",
    };
  }
}

/**
 * Save WinLeadPlus configuration (create or update)
 */
export async function saveWinLeadPlusConfig(params: {
  id?: string;
  organisationId?: string;
  apiEndpoint?: string;
  enabled?: boolean;
  syncIntervalMinutes?: number;
  apiToken?: string;
}): Promise<ActionResult<WinLeadPlusConfig>> {
  try {
    const data = await winleadplus.saveConfig({
      id: params.id || "",
      organisation_id: params.organisationId,
      api_endpoint: params.apiEndpoint,
      enabled: params.enabled,
      sync_interval_minutes: params.syncIntervalMinutes,
      api_token: params.apiToken,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[saveWinLeadPlusConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la sauvegarde de la configuration WinLeadPlus",
    };
  }
}

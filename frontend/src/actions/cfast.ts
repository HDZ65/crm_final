"use server";

import { cfastConfig, cfastImport, cfastPush, payments } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  CfastConfig,
  TestCfastConnectionResponse,
  ImportInvoicesResponse,
  PushClientResponse,
  PushContractResponse,
  AssignSubscriptionResponse,
  SyncUnpaidInvoicesResponse,
  GetEntityMappingsResponse,
  EntityMapping,
} from "@proto/cfast/cfast";
import type { GetSyncStatusResponse as CfastSyncStatusResponse } from "@proto/cfast/cfast";

/**
 * Get CFAST configuration by organisation ID
 */
export async function getCfastConfig(
  organisationId: string
): Promise<ActionResult<CfastConfig>> {
  try {
    const data = await cfastConfig.getByOrganisation({ organisationId });
    return { data, error: null };
  } catch (err) {
    console.error("[getCfastConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la configuration CFAST",
    };
  }
}

/**
 * Save CFAST configuration (create or update)
 */
export async function saveCfastConfig(input: {
  organisationId: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  scopes?: string;
}): Promise<ActionResult<CfastConfig>> {
  try {
    // Check if config exists
    let existingConfig: CfastConfig | null = null;
    try {
      existingConfig = await cfastConfig.getByOrganisation({
        organisationId: input.organisationId,
      });
    } catch {
      // Config doesn't exist, will create new one
    }

    const request = {
      organisationId: input.organisationId,
      baseUrl: input.baseUrl,
      clientIdEncrypted: input.clientId,
      clientSecretEncrypted: input.clientSecret,
      usernameEncrypted: input.username,
      passwordEncrypted: input.password,
      scopes: input.scopes || "openid identity bill",
    };

    let data: CfastConfig;
    if (existingConfig) {
      // Update existing config
      data = await cfastConfig.update({
        id: existingConfig.id,
        baseUrl: request.baseUrl,
        clientIdEncrypted: request.clientIdEncrypted,
        clientSecretEncrypted: request.clientSecretEncrypted,
        usernameEncrypted: request.usernameEncrypted,
        passwordEncrypted: request.passwordEncrypted,
        scopes: request.scopes,
        active: existingConfig.active,
      });
    } else {
      // Create new config
      data = await cfastConfig.create(request);
    }

    revalidatePath("/parametres/integrations");
    return { data, error: null };
  } catch (err) {
    console.error("[saveCfastConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la sauvegarde de la configuration CFAST",
    };
  }
}

/**
 * Delete CFAST configuration
 */
export async function deleteCfastConfig(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await cfastConfig.delete({ id });
    revalidatePath("/parametres/integrations");
    return { data: { success: result.success }, error: null };
  } catch (err) {
    console.error("[deleteCfastConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la configuration CFAST",
    };
  }
}

/**
 * Test CFAST connection
 */
export async function testCfastConnection(
  organisationId: string
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const result = await cfastConfig.testConnection({
      organisationId: organisationId,
    });
    return {
      data: { success: result.success, message: result.message },
      error: null,
    };
  } catch (err) {
    console.error("[testCfastConnection] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du test de connexion CFAST",
    };
  }
}

/**
 * Import CFAST invoices
 */
export async function importCfastInvoices(
  organisationId: string
): Promise<ActionResult<{ importedCount: number; skippedCount: number; errors: string[] }>> {
  try {
    const result = await cfastImport.importInvoices({
      organisationId: organisationId,
    });
    revalidatePath("/facturation");
    return {
      data: {
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
        errors: result.errors,
      },
      error: null,
    };
  } catch (err) {
    console.error("[importCfastInvoices] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'import des factures CFAST",
    };
  }
}

/**
 * Push a CRM client to CFAST (create customer + billing point + site)
 */
export async function pushClientToCfast(
  organisationId: string,
  clientId: string
): Promise<ActionResult<{ cfastCustomerId: string }>> {
  try {
    const result = await cfastPush.pushClientToCfast({
      organisationId,
      clientId,
    });
    if (!result.success) {
      return { data: null, error: result.errorMessage || "Erreur lors du push client vers CFAST" };
    }
    return { data: { cfastCustomerId: result.cfastCustomerId }, error: null };
  } catch (err) {
    console.error("[pushClientToCfast] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du push client vers CFAST",
    };
  }
}

/**
 * Push a CRM contract to CFAST (create contract + upload PDF)
 */
export async function pushContractToCfast(
  organisationId: string,
  contratId: string
): Promise<ActionResult<{ cfastContractId: string }>> {
  try {
    const result = await cfastPush.pushContractToCfast({
      organisationId,
      contratId,
    });
    if (!result.success) {
      return { data: null, error: result.errorMessage || "Erreur lors du push contrat vers CFAST" };
    }
    return { data: { cfastContractId: result.cfastContractId }, error: null };
  } catch (err) {
    console.error("[pushContractToCfast] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du push contrat vers CFAST",
    };
  }
}

/**
 * Assign a CRM contract as a subscription/service in CFAST
 */
export async function assignSubscriptionInCfast(
  organisationId: string,
  contratId: string
): Promise<ActionResult<{ cfastServiceId: string }>> {
  try {
    const result = await cfastPush.assignSubscriptionInCfast({
      organisationId,
      contratId,
    });
    if (!result.success) {
      return { data: null, error: result.errorMessage || "Erreur lors de l'assignation d'abonnement CFAST" };
    }
    return { data: { cfastServiceId: result.cfastServiceId }, error: null };
  } catch (err) {
    console.error("[assignSubscriptionInCfast] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'assignation d'abonnement CFAST",
    };
  }
}

/**
 * Trigger unpaid invoice sync from CFAST for a given organisation
 */
export async function syncUnpaidInvoices(
  organisationId: string
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const result = await cfastPush.syncUnpaidInvoices({
      organisationId,
    });
    return {
      data: { success: result.success, message: result.message },
      error: null,
    };
  } catch (err) {
    console.error("[syncUnpaidInvoices] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la synchronisation des factures impayées",
    };
  }
}

/**
 * Get CFAST sync status for an organisation
 */
export async function getCfastSyncStatus(
  organisationId: string
): Promise<ActionResult<{ lastSyncAt: string; lastImportedCount: number; syncError: string; isConnected: boolean }>> {
  try {
    const result = await cfastPush.getCfastSyncStatus({
      organisationId,
    });
    return {
      data: {
        lastSyncAt: result.lastSyncAt,
        lastImportedCount: result.lastImportedCount,
        syncError: result.syncError,
        isConnected: result.isConnected,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getCfastSyncStatus] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du statut de synchronisation",
    };
  }
}

/**
 * Get all CFAST entity mappings for an organisation
 */
export async function getCfastEntityMappings(
  organisationId: string
): Promise<ActionResult<{ mappings: Array<{ crmEntityType: string; crmEntityId: string; cfastEntityType: string; cfastEntityId: string; metadataJson: string }> }>> {
  try {
    const result = await cfastPush.getCfastEntityMappings({
      organisationId,
    });
    return {
      data: {
        mappings: (result.mappings || []).map((m) => ({
          crmEntityType: m.crmEntityType,
          crmEntityId: m.crmEntityId,
          cfastEntityType: m.cfastEntityType,
          cfastEntityId: m.cfastEntityId,
          metadataJson: m.metadataJson,
        })),
      },
      error: null,
    };
  } catch (err) {
    console.error("[getCfastEntityMappings] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération des mappings d'entités CFAST",
    };
  }
}

/**
 * Get GoCardless mandate status for an organisation (counts)
 */
export async function getCfastGoCardlessMandateStatus(
  organisationId: string
): Promise<ActionResult<{ total: number; activeCount: number; pendingCount: number }>> {
  try {
    const result = await payments.listGoCardlessMandates({
      organisationId,
    });
    return {
      data: {
        total: result.total,
        activeCount: result.activeCount,
        pendingCount: result.pendingCount,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getCfastGoCardlessMandateStatus] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du statut des mandats GoCardless",
    };
  }
}

"use server";

import { cfastConfig, cfastImport } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  CfastConfig,
  TestCfastConnectionResponse,
  ImportInvoicesResponse,
} from "@proto/cfast/cfast";

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
    revalidatePath("/factures");
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

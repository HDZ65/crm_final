"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";

// ---------------------------------------------------------------------------
// Local types — proto definitions pending generation
// ---------------------------------------------------------------------------

interface SavePSPAccountRequest {
  organisationId: string;
  provider: string;
  apiKey: string;
  webhookSecret?: string;
  isLive?: boolean;
}

interface SavePSPAccountResponse {
  accountId: string;
  success: boolean;
}

interface GetPSPAccountRequest {
  organisationId: string;
  provider?: string;
}

interface GetPSPAccountResponse {
  accountId: string;
  provider: string;
  isActive: boolean;
  isLive: boolean;
}

interface TestPSPConnectionRequest {
  organisationId: string;
  provider: string;
}

interface TestPSPConnectionResponse {
  success: boolean;
  message: string;
}

interface DeactivatePSPAccountRequest {
  organisationId: string;
  provider: string;
}

interface DeactivatePSPAccountResponse {
  success: boolean;
}

/**
 * Save PSP account configuration via gRPC
 * Stubbed — gRPC methods not yet generated
 */
export async function savePSPAccount(
  _request: SavePSPAccountRequest
): Promise<ActionResult<SavePSPAccountResponse>> {
  try {
    // gRPC method not yet available in proto
    revalidatePath("/parametres/integrations");
    return {
      data: null,
      error: "PSP account save not yet implemented (proto pending)",
    };
  } catch (err) {
    console.error("[savePSPAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la sauvegarde du compte PSP",
    };
  }
}

/**
 * Get PSP account configuration via gRPC
 * Stubbed — gRPC methods not yet generated
 */
export async function getPSPAccount(
  _request: GetPSPAccountRequest
): Promise<ActionResult<GetPSPAccountResponse>> {
  try {
    return {
      data: null,
      error: "PSP account retrieval not yet implemented (proto pending)",
    };
  } catch (err) {
    console.error("[getPSPAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du compte PSP",
    };
  }
}

/**
 * Test PSP connection via gRPC
 * Stubbed — gRPC methods not yet generated
 */
export async function testPSPConnection(
  _request: TestPSPConnectionRequest
): Promise<ActionResult<TestPSPConnectionResponse>> {
  try {
    return {
      data: null,
      error: "PSP connection test not yet implemented (proto pending)",
    };
  } catch (err) {
    console.error("[testPSPConnection] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du test de connexion PSP",
    };
  }
}

/**
 * Deactivate PSP account via gRPC
 * Stubbed — gRPC methods not yet generated
 */
export async function deactivatePSPAccount(
  _request: DeactivatePSPAccountRequest
): Promise<ActionResult<DeactivatePSPAccountResponse>> {
  try {
    revalidatePath("/parametres/integrations");
    return {
      data: null,
      error: "PSP account deactivation not yet implemented (proto pending)",
    };
  } catch (err) {
    console.error("[deactivatePSPAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la désactivation du compte PSP",
    };
  }
}

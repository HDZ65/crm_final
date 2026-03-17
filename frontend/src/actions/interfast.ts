"use server";

import { interfastConfig } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  InterfastConfig,
  TestInterfastConnectionResponse,
  SaveEnabledRoutesResponse,
  GetEnabledRoutesResponse,
} from "@proto/interfast/interfast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when the gRPC backend is simply not deployed yet. */
function isServiceUnavailable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("unimplemented") ||
    msg.includes("unavailable") ||
    msg.includes("unknown service") ||
    msg.includes("connect econnrefused")
  );
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * Get InterFast configuration by organisation ID.
 * Returns null silently when the backend service is not deployed yet.
 */
export async function getInterfastConfig(
  organisationId: string
): Promise<ActionResult<InterfastConfig>> {
  try {
    const data = await interfastConfig.getByOrganisation({ organisationId });
    return { data, error: null };
  } catch (err) {
    if (isServiceUnavailable(err)) {
      return { data: null, error: null };
    }
    console.error("[getInterfastConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la configuration InterFast",
    };
  }
}

/**
 * Save InterFast configuration (create or update)
 */
export async function saveInterfastConfig(input: {
  organisationId: string;
  apiUrl: string;
  apiKey: string;
  username: string;
  password: string;
}): Promise<ActionResult<InterfastConfig>> {
  try {
    // Check if config exists
    let existingConfig: InterfastConfig | null = null;
    try {
      existingConfig = await interfastConfig.getByOrganisation({
        organisationId: input.organisationId,
      });
    } catch {
      // Config doesn't exist, will create new one
    }

    let data: InterfastConfig;
    if (existingConfig?.id) {
      data = await interfastConfig.update({
        id: existingConfig.id,
        apiUrl: input.apiUrl,
        apiKey: input.apiKey,
        username: input.username,
        password: input.password,
      });
    } else {
      data = await interfastConfig.create({
        organisationId: input.organisationId,
        apiUrl: input.apiUrl,
        apiKey: input.apiKey,
        username: input.username,
        password: input.password,
      });
    }

    revalidatePath("/parametres/integrations");
    revalidatePath("/parametres/integrations/interfast");
    return { data, error: null };
  } catch (err) {
    if (isServiceUnavailable(err)) {
      return {
        data: null,
        error: "Le service InterFast n'est pas encore disponible. Le backend doit être déployé.",
      };
    }
    console.error("[saveInterfastConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde de la configuration InterFast",
    };
  }
}

/**
 * Test InterFast connection
 */
export async function testInterfastConnection(
  organisationId: string
): Promise<ActionResult<TestInterfastConnectionResponse>> {
  try {
    const data = await interfastConfig.testConnection({ organisationId });
    return { data, error: null };
  } catch (err) {
    if (isServiceUnavailable(err)) {
      return {
        data: null,
        error: "Le service InterFast n'est pas encore disponible.",
      };
    }
    console.error("[testInterfastConnection] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du test de connexion InterFast",
    };
  }
}

// ---------------------------------------------------------------------------
// Route enablement
// ---------------------------------------------------------------------------

/**
 * Save enabled routes for an organisation
 */
export async function saveInterfastEnabledRoutes(
  organisationId: string,
  enabledRoutes: string[]
): Promise<ActionResult<SaveEnabledRoutesResponse>> {
  try {
    const data = await interfastConfig.saveEnabledRoutes({
      organisationId,
      enabledRoutes,
    });
    revalidatePath("/parametres/integrations/interfast");
    return { data, error: null };
  } catch (err) {
    if (isServiceUnavailable(err)) {
      return {
        data: null,
        error: "Le service InterFast n'est pas encore disponible. Les routes seront sauvegardées quand le backend sera déployé.",
      };
    }
    console.error("[saveInterfastEnabledRoutes] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde des routes",
    };
  }
}

/**
 * Get enabled routes for an organisation.
 * Returns empty list silently when backend is not deployed.
 */
export async function getInterfastEnabledRoutes(
  organisationId: string
): Promise<ActionResult<GetEnabledRoutesResponse>> {
  try {
    const data = await interfastConfig.getEnabledRoutes({ organisationId });
    return { data, error: null };
  } catch (err) {
    if (isServiceUnavailable(err)) {
      return { data: { enabledRoutes: [] }, error: null };
    }
    console.error("[getInterfastEnabledRoutes] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des routes activées",
    };
  }
}

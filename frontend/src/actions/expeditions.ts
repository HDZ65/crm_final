"use server";

import { logistics } from "@/lib/grpc";
import type {
  ExpeditionResponse,
  ExpeditionListResponse,
} from "@proto/logistics/logistics";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch les expéditions d'un client via gRPC
 */
export async function getClientExpeditions(
  clientBaseId: string
): Promise<ActionResult<ExpeditionListResponse>> {
  try {
    const data = await logistics.getExpeditionsByClient({
      clientBaseId,
      limit: 100,
      offset: 0,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getClientExpeditions] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des expéditions",
    };
  }
}

/**
 * Fetch les expéditions par organisation via gRPC
 */
export async function getExpeditionsByOrganisation(params: {
  organisationId: string;
  etat?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<ExpeditionListResponse>> {
  try {
    const data = await logistics.getExpeditionsByOrganisation({
      organisationId: params.organisationId,
      etat: params.etat,
      limit: params.limit || 100,
      offset: params.offset || 0,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getExpeditionsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des expéditions",
    };
  }
}

/**
 * Fetch une expédition par ID via gRPC
 */
export async function getExpedition(
  id: string
): Promise<ActionResult<ExpeditionResponse>> {
  try {
    const data = await logistics.getExpedition({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getExpedition] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de l'expédition",
    };
  }
}

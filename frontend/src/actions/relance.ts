"use server";

import { reglesRelance, historiqueRelance, relanceEngine } from "@/lib/grpc";
import type {
  RegleRelance,
  HistoriqueRelance,
  CreateRegleRelanceRequest,
  UpdateRegleRelanceRequest,
} from "@proto/relance/relance";
import type { ActionResult } from "@/lib/types/common";

/**
 * List regles de relance
 */
export async function listReglesRelance(
  organisationId: string
): Promise<ActionResult<RegleRelance[]>> {
  try {
    const data = await reglesRelance.list({ organisationId, pagination: undefined });
    return {
      data: data.regles,
      error: null,
    };
  } catch (err) {
    console.error("[listReglesRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des regles",
    };
  }
}

/**
 * Get regle de relance by ID
 */
export async function getRegleRelance(
  id: string
): Promise<ActionResult<RegleRelance>> {
  try {
    const data = await reglesRelance.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la regle",
    };
  }
}

/**
 * Create regle de relance
 */
export async function createRegleRelance(
  dto: CreateRegleRelanceRequest
): Promise<ActionResult<RegleRelance>> {
  try {
    const data = await reglesRelance.create(dto);
    return { data, error: null };
  } catch (err) {
    console.error("[createRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation de la regle",
    };
  }
}

/**
 * Update regle de relance
 */
export async function updateRegleRelance(
  id: string,
  dto: Omit<UpdateRegleRelanceRequest, "id">
): Promise<ActionResult<RegleRelance>> {
  try {
    const data = await reglesRelance.update({ id, ...dto });
    return { data, error: null };
  } catch (err) {
    console.error("[updateRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise a jour de la regle",
    };
  }
}

/**
 * Delete regle de relance
 */
export async function deleteRegleRelance(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await reglesRelance.delete({ id });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la regle",
    };
  }
}

/**
 * Activer regle de relance
 */
export async function activerRegleRelance(
  id: string
): Promise<ActionResult<RegleRelance>> {
  try {
    const data = await reglesRelance.activate({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[activerRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation de la regle",
    };
  }
}

/**
 * Desactiver regle de relance
 */
export async function desactiverRegleRelance(
  id: string
): Promise<ActionResult<RegleRelance>> {
  try {
    const data = await reglesRelance.deactivate({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la desactivation de la regle",
    };
  }
}

/**
 * List historique des relances
 */
export async function listHistoriqueRelances(
  organisationId: string,
  options?: { limit?: number }
): Promise<ActionResult<HistoriqueRelance[]>> {
  try {
    const data = await historiqueRelance.list({
      organisationId,
      pagination: options?.limit
        ? { page: 1, limit: options.limit, sortBy: "dateExecution", sortOrder: "desc" }
        : undefined,
    });
    return {
      data: data.historiques,
      error: null,
    };
  } catch (err) {
    console.error("[listHistoriqueRelances] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de l'historique",
    };
  }
}

/**
 * Execute relances manuellement
 */
export async function executerRelances(
  organisationId: string
): Promise<ActionResult<{ success: boolean; message: string; relancesExecutees: number; relancesEchouees: number }>> {
  try {
    const data = await relanceEngine.execute({ organisationId });
    return {
      data: {
        success: data.success,
        message: data.message,
        relancesExecutees: data.relancesExecutees,
        relancesEchouees: data.relancesEchouees,
      },
      error: null,
    };
  } catch (err) {
    console.error("[executerRelances] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'execution des relances",
    };
  }
}

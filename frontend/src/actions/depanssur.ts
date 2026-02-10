"use server";

import { depanssurClient } from "@/lib/grpc/clients/depanssur";
import type { ActionResult } from "@/lib/types/common";
import type {
  AbonnementDepanssur,
  CreateAbonnementRequest,
  GetAbonnementByClientRequest,
  GetCompteurRequest,
  CompteurPlafond,
  ListOptionsRequest,
  ListOptionsResponse,
  ListAbonnementsRequest,
  ListAbonnementsResponse,
  ListDossiersRequest,
  ListDossiersResponse,
} from "@proto/depanssur/depanssur";

// ==================== ABONNEMENTS ====================

/**
 * Create a new Depanssur abonnement
 */
export async function createAbonnementAction(
  request: CreateAbonnementRequest
): Promise<ActionResult<AbonnementDepanssur>> {
  try {
    const data = await depanssurClient.createAbonnement(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createAbonnementAction] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'abonnement Depanssur",
    };
  }
}

/**
 * Get abonnement by client ID
 */
export async function getAbonnementByClientAction(
  request: GetAbonnementByClientRequest
): Promise<ActionResult<AbonnementDepanssur>> {
  try {
    const data = await depanssurClient.getAbonnementByClient(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getAbonnementByClientAction] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l'abonnement Depanssur",
    };
  }
}

/**
 * List all abonnements for an organisation
 */
export async function listAbonnementsAction(
  request: ListAbonnementsRequest
): Promise<ActionResult<ListAbonnementsResponse>> {
  try {
    const data = await depanssurClient.listAbonnements(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listAbonnementsAction] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des abonnements Depanssur",
    };
  }
}

// ==================== DOSSIERS ====================

/**
 * List all dossiers for an organisation
 */
export async function listDossiersAction(
  request: ListDossiersRequest
): Promise<ActionResult<ListDossiersResponse>> {
  try {
    const data = await depanssurClient.listDossiers(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listDossiersAction] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des dossiers Depanssur",
    };
  }
}

// ==================== OPTIONS ====================

/**
 * List options for an abonnement
 */
export async function listOptionsAction(
  request: ListOptionsRequest
): Promise<ActionResult<ListOptionsResponse>> {
  try {
    const data = await depanssurClient.listOptions(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listOptionsAction] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des options Depanssur",
    };
  }
}

// ==================== COMPTEURS ====================

/**
 * Get current compteur for an abonnement
 */
export async function getCurrentCompteurAction(
  request: GetCompteurRequest
): Promise<ActionResult<CompteurPlafond>> {
  try {
    const data = await depanssurClient.getCurrentCompteur(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getCurrentCompteurAction] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du compteur Depanssur",
    };
  }
}

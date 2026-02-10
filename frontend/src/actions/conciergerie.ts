"use server";

import { conciergerie } from "@/lib/grpc/clients";
import type {
  GetDemandeRequest,
  GetDemandeResponse,
  ListDemandesRequest,
  ListDemandesResponse,
  CreateDemandeRequest,
  CreateDemandeResponse,
} from "@proto/services/conciergerie";
import type { ActionResult } from "@/lib/types/common";

/**
 * Get a ticket (demande) by ID
 */
export async function getDemande(
  params: GetDemandeRequest
): Promise<ActionResult<GetDemandeResponse>> {
  try {
    const data = await conciergerie.getDemande(params);
    return { data, error: null };
  } catch (err) {
    console.error("[getDemande] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la demande",
    };
  }
}

/**
 * List tickets (demandes) for a client
 */
export async function listDemandes(
  params: ListDemandesRequest
): Promise<ActionResult<ListDemandesResponse>> {
  try {
    const data = await conciergerie.listDemandes(params);
    return { data, error: null };
  } catch (err) {
    console.error("[listDemandes] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des demandes",
    };
  }
}

/**
 * Create a new ticket (demande)
 */
export async function createDemande(
  params: CreateDemandeRequest
): Promise<ActionResult<CreateDemandeResponse>> {
  try {
    const data = await conciergerie.createDemande(params);
    return { data, error: null };
  } catch (err) {
    console.error("[createDemande] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la demande",
    };
  }
}

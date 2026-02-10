"use server";

import { justiPlus } from "@/lib/grpc/clients";
import type {
  GetCasRequest,
  GetCasResponse,
  ListCasRequest,
  ListCasResponse,
} from "@proto/services/justi-plus";
import type { ActionResult } from "@/lib/types/common";

/**
 * Get a legal case (cas) by ID
 */
export async function getCas(
  params: GetCasRequest
): Promise<ActionResult<GetCasResponse>> {
  try {
    const data = await justiPlus.getCas(params);
    return { data, error: null };
  } catch (err) {
    console.error("[getCas] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du cas",
    };
  }
}

/**
 * List legal cases (cas) for a client
 */
export async function listCas(
  params: ListCasRequest
): Promise<ActionResult<ListCasResponse>> {
  try {
    const data = await justiPlus.listCas(params);
    return { data, error: null };
  } catch (err) {
    console.error("[listCas] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des cas",
    };
  }
}

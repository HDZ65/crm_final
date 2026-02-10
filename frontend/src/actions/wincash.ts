"use server";

import { wincash } from "@/lib/grpc/clients";
import type {
  GetOperationRequest,
  GetOperationResponse,
  ListOperationsRequest,
  ListOperationsResponse,
} from "@proto/services/wincash";
import type { ActionResult } from "@/lib/types/common";

/**
 * Get a cashback operation by ID
 */
export async function getOperation(
  params: GetOperationRequest
): Promise<ActionResult<GetOperationResponse>> {
  try {
    const data = await wincash.getOperation(params);
    return { data, error: null };
  } catch (err) {
    console.error("[getOperation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de l'opération",
    };
  }
}

/**
 * List cashback operations for a client
 */
export async function listOperations(
  params: ListOperationsRequest
): Promise<ActionResult<ListOperationsResponse>> {
  try {
    const data = await wincash.listOperations(params);
    return { data, error: null };
  } catch (err) {
    console.error("[listOperations] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des opérations",
    };
  }
}

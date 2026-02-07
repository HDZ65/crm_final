"use server";

import { payments } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  CreateRoutingRuleRequest,
  RoutingRuleResponse,
  UpdateRoutingRuleRequest,
  DeleteRoutingRuleResponse,
  ListRoutingRulesRequest,
  ListRoutingRulesResponse,
  TestRoutingRuleRequest,
  TestRoutingRuleResponse,
  CreateProviderOverrideRequest,
  ProviderOverrideResponse,
  DeleteProviderOverrideResponse,
  ListProviderOverridesRequest,
  ListProviderOverridesResponse,
  CreateReassignmentJobRequest,
  ReassignmentJobResponse,
} from "@proto/payments/payment";
import type { ActionResult } from "@/lib/types/common";

// ==================== ROUTING RULES ====================

/**
 * Create a routing rule via gRPC
 */
export async function createRoutingRule(
  request: CreateRoutingRuleRequest
): Promise<ActionResult<RoutingRuleResponse>> {
  try {
    const data = await payments.createRoutingRule(request);
    revalidatePath("/payments/routing");
    return { data, error: null };
  } catch (err) {
    console.error("[createRoutingRule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la règle de routage",
    };
  }
}

/**
 * Update a routing rule via gRPC
 */
export async function updateRoutingRule(
  request: UpdateRoutingRuleRequest
): Promise<ActionResult<RoutingRuleResponse>> {
  try {
    const data = await payments.updateRoutingRule(request);
    revalidatePath("/payments/routing");
    return { data, error: null };
  } catch (err) {
    console.error("[updateRoutingRule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la règle de routage",
    };
  }
}

/**
 * Delete a routing rule via gRPC
 */
export async function deleteRoutingRule(
  id: string,
  societeId: string
): Promise<ActionResult<DeleteRoutingRuleResponse>> {
  try {
    const data = await payments.deleteRoutingRule({ id, societeId });
    revalidatePath("/payments/routing");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteRoutingRule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la règle de routage",
    };
  }
}

/**
 * List routing rules via gRPC
 */
export async function listRoutingRules(
  request: ListRoutingRulesRequest
): Promise<ActionResult<ListRoutingRulesResponse>> {
  try {
    const data = await payments.listRoutingRules(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listRoutingRules] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des règles de routage",
    };
  }
}

/**
 * Test a routing rule via gRPC
 */
export async function testRoutingRule(
  request: TestRoutingRuleRequest
): Promise<ActionResult<TestRoutingRuleResponse>> {
  try {
    const data = await payments.testRoutingRule(request);
    return { data, error: null };
  } catch (err) {
    console.error("[testRoutingRule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du test de la règle de routage",
    };
  }
}

// ==================== PROVIDER OVERRIDES ====================

/**
 * Create a provider override via gRPC
 */
export async function createProviderOverride(
  request: CreateProviderOverrideRequest
): Promise<ActionResult<ProviderOverrideResponse>> {
  try {
    const data = await payments.createProviderOverride(request);
    revalidatePath("/payments/routing");
    return { data, error: null };
  } catch (err) {
    console.error("[createProviderOverride] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'override fournisseur",
    };
  }
}

/**
 * Delete a provider override via gRPC
 */
export async function deleteProviderOverride(
  id: string,
  societeId: string
): Promise<ActionResult<DeleteProviderOverrideResponse>> {
  try {
    const data = await payments.deleteProviderOverride({ id, societeId });
    revalidatePath("/payments/routing");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteProviderOverride] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de l'override fournisseur",
    };
  }
}

/**
 * List provider overrides via gRPC
 */
export async function listProviderOverrides(
  request: ListProviderOverridesRequest
): Promise<ActionResult<ListProviderOverridesResponse>> {
  try {
    const data = await payments.listProviderOverrides(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listProviderOverrides] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des overrides fournisseur",
    };
  }
}

// ==================== REASSIGNMENT JOBS ====================

/**
 * Create a reassignment job via gRPC
 */
export async function createReassignmentJob(
  request: CreateReassignmentJobRequest
): Promise<ActionResult<ReassignmentJobResponse>> {
  try {
    const data = await payments.createReassignmentJob(request);
    revalidatePath("/payments/routing");
    return { data, error: null };
  } catch (err) {
    console.error("[createReassignmentJob] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du job de réassignation",
    };
  }
}

/**
 * Get a reassignment job by ID via gRPC
 */
export async function getReassignmentJob(
  id: string,
  societeId: string
): Promise<ActionResult<ReassignmentJobResponse>> {
  try {
    const data = await payments.getReassignmentJob({ id, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getReassignmentJob] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du job de réassignation",
    };
  }
}

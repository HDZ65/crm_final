"use server";

import { revalidatePath } from "next/cache";
import { telecomProvisioning } from "@/lib/grpc";
import type { ActionResult } from "@/lib/types/common";
import type {
  ListProvisioningLifecyclesResponse,
  GetProvisioningLifecycleResponse,
  GetProvisioningStatsResponse,
  RetryTransatelActivationResponse,
  RetrySepaMandateResponse,
  ForceActiveResponse,
  TriggerRetractionDeadlineResponse,
  CancelProvisioningResponse,
} from "@proto/telecom/telecom";

// ============================================================================
// Provisioning Lifecycle Query Actions
// ============================================================================

export async function listProvisioningLifecycles(input: {
  organisationId: string;
  stateFilter?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<ListProvisioningLifecyclesResponse>> {
  try {
    const data = await telecomProvisioning.listProvisioningLifecycles({
      organisationId: input.organisationId,
      stateFilter: input.stateFilter || "",
      search: input.search || "",
      page: input.page || 0,
      limit: input.limit || 10,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listProvisioningLifecycles] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des cycles de provisioning",
    };
  }
}

export async function getProvisioningLifecycle(
  id: string
): Promise<ActionResult<GetProvisioningLifecycleResponse>> {
  try {
    const data = await telecomProvisioning.getProvisioningLifecycle({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getProvisioningLifecycle] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du cycle de provisioning",
    };
  }
}

export async function getProvisioningStats(
  organisationId: string
): Promise<ActionResult<GetProvisioningStatsResponse>> {
  try {
    const data = await telecomProvisioning.getProvisioningStats({ organisationId });
    return { data, error: null };
  } catch (err) {
    console.error("[getProvisioningStats] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des statistiques de provisioning",
    };
  }
}

// ============================================================================
// Provisioning Lifecycle Action (Mutation) Functions
// ============================================================================

export async function retryTransatelActivation(
  id: string
): Promise<ActionResult<RetryTransatelActivationResponse>> {
  try {
    const data = await telecomProvisioning.retryTransatelActivation({ id });
    revalidatePath("/telecom");
    return { data, error: null };
  } catch (err) {
    console.error("[retryTransatelActivation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la réactivation Transatel",
    };
  }
}

export async function retrySepaMandate(
  id: string
): Promise<ActionResult<RetrySepaMandateResponse>> {
  try {
    const data = await telecomProvisioning.retrySepaMandate({ id });
    revalidatePath("/telecom");
    return { data, error: null };
  } catch (err) {
    console.error("[retrySepaMandate] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la réactivation du mandat SEPA",
    };
  }
}

export async function forceActive(id: string): Promise<ActionResult<ForceActiveResponse>> {
  try {
    const data = await telecomProvisioning.forceActive({ id });
    revalidatePath("/telecom");
    return { data, error: null };
  } catch (err) {
    console.error("[forceActive] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la forçage de l'activation",
    };
  }
}

export async function triggerRetractionDeadline(
  id: string
): Promise<ActionResult<TriggerRetractionDeadlineResponse>> {
  try {
    const data = await telecomProvisioning.triggerRetractionDeadline({ id });
    revalidatePath("/telecom");
    return { data, error: null };
  } catch (err) {
    console.error("[triggerRetractionDeadline] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du déclenchement du délai de rétractation",
    };
  }
}

export async function cancelProvisioning(
  id: string
): Promise<ActionResult<CancelProvisioningResponse>> {
  try {
    const data = await telecomProvisioning.cancelProvisioning({ id });
    revalidatePath("/telecom");
    return { data, error: null };
  } catch (err) {
    console.error("[cancelProvisioning] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation du provisioning",
    };
  }
}

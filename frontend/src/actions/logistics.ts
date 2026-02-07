"use server";

import { revalidatePath } from "next/cache";
import {
  logistics,
  fulfillmentBatch,
  fulfillmentCutoff,
} from "@/lib/grpc/clients/logistics";
import type { ActionResult } from "@/lib/types/common";
import type {
  CarrierAccountResponse,
  CarrierAccountListResponse,
  FulfillmentBatch,
  ListFulfillmentBatchResponse,
  FulfillmentCutoffConfig,
} from "@/lib/grpc/clients/logistics";

// ==================== CARRIER ACCOUNTS ====================

/**
 * Create a new carrier account
 */
export async function createCarrierAccount(params: {
  organisationId: string;
  type: string;
  contractNumber: string;
  password: string;
  labelFormat: string;
  actif: boolean;
}): Promise<ActionResult<CarrierAccountResponse>> {
  try {
    const data = await logistics.createCarrierAccount({
      organisation_id: params.organisationId,
      type: params.type,
      contract_number: params.contractNumber,
      password: params.password,
      label_format: params.labelFormat,
      actif: params.actif,
    });
    revalidatePath("/expeditions");
    return { data, error: null };
  } catch (err) {
    console.error("[createCarrierAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du compte transporteur",
    };
  }
}

/**
 * Get a carrier account by ID
 */
export async function getCarrierAccount(
  id: string
): Promise<ActionResult<CarrierAccountResponse>> {
  try {
    const data = await logistics.getCarrierAccount({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getCarrierAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du compte transporteur",
    };
  }
}

/**
 * Get all carrier accounts for an organisation
 */
export async function getCarrierAccountsByOrganisation(
  organisationId: string
): Promise<ActionResult<CarrierAccountListResponse>> {
  try {
    const data = await logistics.getCarrierAccountsByOrganisation({
      organisation_id: organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getCarrierAccountsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des comptes transporteurs",
    };
  }
}

/**
 * Update a carrier account
 */
export async function updateCarrierAccount(params: {
  id: string;
  contractNumber?: string;
  password?: string;
  labelFormat?: string;
  actif?: boolean;
}): Promise<ActionResult<CarrierAccountResponse>> {
  try {
    const data = await logistics.updateCarrierAccount({
      id: params.id,
      contract_number: params.contractNumber,
      password: params.password,
      label_format: params.labelFormat,
      actif: params.actif,
    });
    revalidatePath("/expeditions");
    return { data, error: null };
  } catch (err) {
    console.error("[updateCarrierAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du compte transporteur",
    };
  }
}

/**
 * Delete a carrier account
 */
export async function deleteCarrierAccount(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const data = await logistics.deleteCarrierAccount({ id });
    revalidatePath("/expeditions");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteCarrierAccount] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du compte transporteur",
    };
  }
}

// ==================== FULFILLMENT BATCH ====================

/**
 * Create a new fulfillment batch
 */
export async function createFulfillmentBatch(params: {
  organisationId: string;
  label?: string;
  cutoffDate?: string;
}): Promise<ActionResult<FulfillmentBatch>> {
  try {
    const data = await fulfillmentBatch.create({
      organisation_id: params.organisationId,
      label: params.label,
      cutoff_date: params.cutoffDate,
    });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[createFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du lot fulfillment",
    };
  }
}

/**
 * Get a fulfillment batch by ID
 */
export async function getFulfillmentBatch(
  id: string
): Promise<ActionResult<FulfillmentBatch>> {
  try {
    const data = await fulfillmentBatch.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du lot fulfillment",
    };
  }
}

/**
 * List fulfillment batches for an organisation
 */
export async function listFulfillmentBatches(params: {
  organisationId: string;
  status?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<ListFulfillmentBatchResponse>> {
  try {
    const data = await fulfillmentBatch.list({
      organisation_id: params.organisationId,
      status: params.status,
      search: params.search,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listFulfillmentBatches] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des lots fulfillment",
    };
  }
}

/**
 * Update a fulfillment batch
 */
export async function updateFulfillmentBatch(params: {
  id: string;
  label?: string;
  cutoffDate?: string;
}): Promise<ActionResult<FulfillmentBatch>> {
  try {
    const data = await fulfillmentBatch.update({
      id: params.id,
      label: params.label,
      cutoff_date: params.cutoffDate,
    });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[updateFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du lot fulfillment",
    };
  }
}

/**
 * Delete a fulfillment batch
 */
export async function deleteFulfillmentBatch(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const data = await fulfillmentBatch.delete({ id });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du lot fulfillment",
    };
  }
}

/**
 * Lock a fulfillment batch (transition from OPEN to LOCKED)
 */
export async function lockFulfillmentBatch(id: string): Promise<ActionResult<FulfillmentBatch>> {
  try {
    const data = await fulfillmentBatch.lock({ id });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[lockFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du verrouillage du lot fulfillment",
    };
  }
}

/**
 * Dispatch a fulfillment batch (transition from LOCKED to DISPATCHED)
 */
export async function dispatchFulfillmentBatch(params: {
  id: string;
  dispatchDate?: string;
}): Promise<ActionResult<FulfillmentBatch>> {
  try {
    const data = await fulfillmentBatch.dispatch({
      id: params.id,
      dispatch_date: params.dispatchDate,
    });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[dispatchFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'expédition du lot fulfillment",
    };
  }
}

/**
 * Complete a fulfillment batch (transition from DISPATCHED to COMPLETED)
 */
export async function completeFulfillmentBatch(id: string): Promise<ActionResult<FulfillmentBatch>> {
  try {
    const data = await fulfillmentBatch.complete({ id });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[completeFulfillmentBatch] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la finalisation du lot fulfillment",
    };
  }
}

/**
 * Add a line to a fulfillment batch
 */
export async function addFulfillmentBatchLine(params: {
  batchId: string;
  subscriptionId: string;
  clientId: string;
  productId: string;
  productName?: string;
  quantity?: number;
  snapshot?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    preferences?: Record<string, string>;
  };
}): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await fulfillmentBatch.addLine({
      batch_id: params.batchId,
      subscription_id: params.subscriptionId,
      client_id: params.clientId,
      product_id: params.productId,
      product_name: params.productName,
      quantity: params.quantity,
      snapshot: params.snapshot,
    });
    revalidatePath("/expeditions/lots");
    return { data: { id: data.id }, error: null };
  } catch (err) {
    console.error("[addFulfillmentBatchLine] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'ajout de ligne au lot fulfillment",
    };
  }
}

/**
 * Remove a line from a fulfillment batch
 */
export async function removeFulfillmentBatchLine(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const data = await fulfillmentBatch.removeLine({ id });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[removeFulfillmentBatchLine] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de ligne du lot fulfillment",
    };
  }
}

// ==================== FULFILLMENT CUTOFF CONFIG ====================

/**
 * Create a new fulfillment cutoff configuration
 */
export async function createFulfillmentCutoffConfig(params: {
  organisationId: string;
  cutoffDayOfMonth: number;
  cutoffTime: string;
  processingDays: number;
  autoLock: boolean;
  autoDispatch: boolean;
}): Promise<ActionResult<FulfillmentCutoffConfig>> {
  try {
    const data = await fulfillmentCutoff.create({
      organisation_id: params.organisationId,
      cutoff_day_of_month: params.cutoffDayOfMonth,
      cutoff_time: params.cutoffTime,
      processing_days: params.processingDays,
      auto_lock: params.autoLock,
      auto_dispatch: params.autoDispatch,
    });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[createFulfillmentCutoffConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la configuration cutoff",
    };
  }
}

/**
 * Get a fulfillment cutoff configuration by ID
 */
export async function getFulfillmentCutoffConfig(
  id: string
): Promise<ActionResult<FulfillmentCutoffConfig>> {
  try {
    const data = await fulfillmentCutoff.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getFulfillmentCutoffConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la configuration cutoff",
    };
  }
}

/**
 * Get fulfillment cutoff configuration for an organisation
 */
export async function getFulfillmentCutoffConfigByOrganisation(
  organisationId: string
): Promise<ActionResult<FulfillmentCutoffConfig>> {
  try {
    const data = await fulfillmentCutoff.getByOrganisation({
      organisation_id: organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getFulfillmentCutoffConfigByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la configuration cutoff",
    };
  }
}

/**
 * Update a fulfillment cutoff configuration
 */
export async function updateFulfillmentCutoffConfig(params: {
  id: string;
  cutoffDayOfMonth?: number;
  cutoffTime?: string;
  processingDays?: number;
  autoLock?: boolean;
  autoDispatch?: boolean;
}): Promise<ActionResult<FulfillmentCutoffConfig>> {
  try {
    const data = await fulfillmentCutoff.update({
      id: params.id,
      cutoff_day_of_month: params.cutoffDayOfMonth,
      cutoff_time: params.cutoffTime,
      processing_days: params.processingDays,
      auto_lock: params.autoLock,
      auto_dispatch: params.autoDispatch,
    });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[updateFulfillmentCutoffConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la configuration cutoff",
    };
  }
}

/**
 * Delete a fulfillment cutoff configuration
 */
export async function deleteFulfillmentCutoffConfig(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const data = await fulfillmentCutoff.delete({ id });
    revalidatePath("/expeditions/lots");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteFulfillmentCutoffConfig] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la configuration cutoff",
    };
  }
}

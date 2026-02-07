"use server";

import { payments } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  // Slimpay
  CreateSlimpayMandateRequest,
  SlimpayMandateResponse,
  CancelSlimpayMandateRequest,
  CreateSlimpayPaymentRequest,
  SlimpayPaymentResponse,
  // MultiSafepay
  CreateMultiSafepayTransactionRequest,
  MultiSafepayTransactionResponse,
  // Status Mapping
  ListProviderStatusMappingsRequest,
  ListProviderStatusMappingsResponse,
  UpdateProviderStatusMappingRequest,
  ProviderStatusMappingResponse,
  // Rejection Reasons
  ListRejectionReasonsRequest,
  ListRejectionReasonsResponse,
  CreateRejectionReasonRequest,
  RejectionReasonResponse,
  UpdateRejectionReasonRequest,
} from "@proto/payments/payment";
import type { ActionResult } from "@/lib/types/common";

// ==================== SLIMPAY ====================

/**
 * Create a Slimpay mandate via gRPC
 */
export async function createSlimpayMandate(
  request: CreateSlimpayMandateRequest
): Promise<ActionResult<SlimpayMandateResponse>> {
  try {
    const data = await payments.createSlimpayMandate(request);
    revalidatePath("/payments");
    return { data, error: null };
  } catch (err) {
    console.error("[createSlimpayMandate] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du mandat Slimpay",
    };
  }
}

/**
 * Get a Slimpay mandate via gRPC
 */
export async function getSlimpayMandate(
  mandateId: string,
  societeId: string
): Promise<ActionResult<SlimpayMandateResponse>> {
  try {
    const data = await payments.getSlimpayMandate({ mandateId, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getSlimpayMandate] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du mandat Slimpay",
    };
  }
}

/**
 * Cancel a Slimpay mandate via gRPC
 */
export async function cancelSlimpayMandate(
  request: CancelSlimpayMandateRequest
): Promise<ActionResult<SlimpayMandateResponse>> {
  try {
    const data = await payments.cancelSlimpayMandate(request);
    revalidatePath("/payments");
    return { data, error: null };
  } catch (err) {
    console.error("[cancelSlimpayMandate] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation du mandat Slimpay",
    };
  }
}

/**
 * Create a Slimpay payment via gRPC
 */
export async function createSlimpayPayment(
  request: CreateSlimpayPaymentRequest
): Promise<ActionResult<SlimpayPaymentResponse>> {
  try {
    const data = await payments.createSlimpayPayment(request);
    revalidatePath("/payments");
    return { data, error: null };
  } catch (err) {
    console.error("[createSlimpayPayment] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du paiement Slimpay",
    };
  }
}

/**
 * Get a Slimpay payment via gRPC
 */
export async function getSlimpayPayment(
  paymentId: string,
  societeId: string
): Promise<ActionResult<SlimpayPaymentResponse>> {
  try {
    const data = await payments.getSlimpayPayment({ paymentId, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getSlimpayPayment] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du paiement Slimpay",
    };
  }
}

// ==================== MULTISAFEPAY ====================

/**
 * Create a MultiSafepay transaction via gRPC
 */
export async function createMultiSafepayTransaction(
  request: CreateMultiSafepayTransactionRequest
): Promise<ActionResult<MultiSafepayTransactionResponse>> {
  try {
    const data = await payments.createMultiSafepayTransaction(request);
    revalidatePath("/payments");
    return { data, error: null };
  } catch (err) {
    console.error("[createMultiSafepayTransaction] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la transaction MultiSafepay",
    };
  }
}

/**
 * Get a MultiSafepay transaction via gRPC
 */
export async function getMultiSafepayTransaction(
  transactionId: string,
  societeId: string
): Promise<ActionResult<MultiSafepayTransactionResponse>> {
  try {
    const data = await payments.getMultiSafepayTransaction({ transactionId, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getMultiSafepayTransaction] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la transaction MultiSafepay",
    };
  }
}

/**
 * Refund a MultiSafepay transaction via gRPC
 */
export async function refundMultiSafepayTransaction(params: {
  transactionId: string;
  societeId: string;
  amountCents: number;
  description?: string;
}): Promise<ActionResult<MultiSafepayTransactionResponse>> {
  try {
    const data = await payments.refundMultiSafepayTransaction({
      transactionId: params.transactionId,
      societeId: params.societeId,
      amountCents: params.amountCents,
      description: params.description,
    });
    revalidatePath("/payments");
    return { data, error: null };
  } catch (err) {
    console.error("[refundMultiSafepayTransaction] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du remboursement MultiSafepay",
    };
  }
}

// ==================== STATUS MAPPING ====================

/**
 * List provider status mappings via gRPC
 */
export async function listProviderStatusMappings(
  request: ListProviderStatusMappingsRequest
): Promise<ActionResult<ListProviderStatusMappingsResponse>> {
  try {
    const data = await payments.listProviderStatusMappings(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listProviderStatusMappings] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des mappings de statuts",
    };
  }
}

/**
 * Update a provider status mapping via gRPC
 */
export async function updateProviderStatusMapping(
  request: UpdateProviderStatusMappingRequest
): Promise<ActionResult<ProviderStatusMappingResponse>> {
  try {
    const data = await payments.updateProviderStatusMapping(request);
    revalidatePath("/payments/status-mapping");
    return { data, error: null };
  } catch (err) {
    console.error("[updateProviderStatusMapping] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du mapping de statut",
    };
  }
}

// ==================== REJECTION REASONS ====================

/**
 * List rejection reasons via gRPC
 */
export async function listRejectionReasons(
  request: ListRejectionReasonsRequest
): Promise<ActionResult<ListRejectionReasonsResponse>> {
  try {
    const data = await payments.listRejectionReasons(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listRejectionReasons] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des motifs de rejet",
    };
  }
}

/**
 * Create a rejection reason via gRPC
 */
export async function createRejectionReason(
  request: CreateRejectionReasonRequest
): Promise<ActionResult<RejectionReasonResponse>> {
  try {
    const data = await payments.createRejectionReason(request);
    revalidatePath("/payments/rejection-reasons");
    return { data, error: null };
  } catch (err) {
    console.error("[createRejectionReason] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du motif de rejet",
    };
  }
}

/**
 * Update a rejection reason via gRPC
 */
export async function updateRejectionReason(
  request: UpdateRejectionReasonRequest
): Promise<ActionResult<RejectionReasonResponse>> {
  try {
    const data = await payments.updateRejectionReason(request);
    revalidatePath("/payments/rejection-reasons");
    return { data, error: null };
  } catch (err) {
    console.error("[updateRejectionReason] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du motif de rejet",
    };
  }
}

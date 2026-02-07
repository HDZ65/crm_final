"use server";

import { payments } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  SetupGoCardlessMandateRequest,
  GoCardlessMandateResponse,
  GetGoCardlessMandateRequest,
  CreateGoCardlessPaymentRequest,
  GoCardlessPaymentResponse,
  CreateGoCardlessSubscriptionRequest,
  GoCardlessSubscriptionResponse,
  CancelGoCardlessSubscriptionRequest,
  PaymentIntentResponse,
  CreatePaymentIntentRequest,
  UpdatePaymentIntentRequest,
  PaymentEventResponse,
  CreatePaymentEventRequest,
  ScheduleResponse,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetByIdRequest,
  CreateStripePaymentIntentRequest,
  StripePaymentIntentResponse,
  CreateStripeCheckoutSessionRequest,
  StripeCheckoutSessionResponse,
  CreateStripeCustomerRequest,
  StripeCustomerResponse,
  CreateStripeSubscriptionRequest,
  StripeSubscriptionResponse,
  CreateStripeRefundRequest,
  PSPAccountsSummaryResponse,
  PSPAccountInfo,
} from "@proto/payments/payment";
import type { ActionResult } from "@/lib/types/common";

/**
 * Setup GoCardless mandate via gRPC
 */
export async function setupGoCardlessMandate(
  request: SetupGoCardlessMandateRequest
): Promise<ActionResult<GoCardlessMandateResponse>> {
  try {
    const data = await payments.setupGoCardlessMandate(request);
    return { data, error: null };
  } catch (err) {
    console.error("[setupGoCardlessMandate] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du setup du mandat",
    };
  }
}

/**
 * Get active GoCardless mandate via gRPC
 */
export async function getGoCardlessMandate(
  request: GetGoCardlessMandateRequest
): Promise<ActionResult<GoCardlessMandateResponse | null>> {
  try {
    const data = await payments.getGoCardlessMandate(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getGoCardlessMandate] gRPC error:", err);
    // Return null instead of error for "not found" cases
    return { data: null, error: null };
  }
}

/**
 * Cancel GoCardless mandate via gRPC
 */
export async function cancelGoCardlessMandate(
  request: GetGoCardlessMandateRequest
): Promise<ActionResult<GoCardlessMandateResponse>> {
  try {
    const data = await payments.cancelGoCardlessMandate(request);
    return { data, error: null };
  } catch (err) {
    console.error("[cancelGoCardlessMandate] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation du mandat",
    };
  }
}

/**
 * Create GoCardless payment via gRPC
 */
export async function createGoCardlessPayment(
  request: CreateGoCardlessPaymentRequest
): Promise<ActionResult<GoCardlessPaymentResponse>> {
  try {
    const data = await payments.createGoCardlessPayment(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createGoCardlessPayment] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du paiement",
    };
  }
}

/**
 * Create GoCardless subscription via gRPC
 */
export async function createGoCardlessSubscription(
  request: CreateGoCardlessSubscriptionRequest
): Promise<ActionResult<GoCardlessSubscriptionResponse>> {
  try {
    const data = await payments.createGoCardlessSubscription(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createGoCardlessSubscription] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'abonnement",
    };
  }
}

/**
 * Cancel GoCardless subscription via gRPC
 */
export async function cancelGoCardlessSubscription(
  request: CancelGoCardlessSubscriptionRequest
): Promise<ActionResult<GoCardlessSubscriptionResponse>> {
  try {
    const data = await payments.cancelGoCardlessSubscription(request);
    return { data, error: null };
  } catch (err) {
    console.error("[cancelGoCardlessSubscription] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation de l'abonnement",
    };
  }
}

// ==================== PAYMENT INTENTS ====================

/**
 * Fetch payment intents by schedule ID via gRPC
 */
export async function getPaymentIntents(params: {
  scheduleId?: string;
}): Promise<ActionResult<PaymentIntentResponse[]>> {
  try {
    // Note: gRPC client doesn't have a list method yet
    // This is a placeholder that would need backend implementation
    // For now, return empty array
    return { data: [], error: null };
  } catch (err) {
    console.error("[getPaymentIntents] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des payment intents",
    };
  }
}

/**
 * Fetch a single payment intent by ID via gRPC
 */
export async function getPaymentIntent(
  id: string
): Promise<ActionResult<PaymentIntentResponse>> {
  try {
    const request: GetByIdRequest = {
      id,
      societe_id: "", // Will be set by backend auth
    };
    const data = await payments.getPaymentIntent(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getPaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du payment intent",
    };
  }
}

/**
 * Create a payment intent via gRPC
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<ActionResult<PaymentIntentResponse>> {
  try {
    const data = await payments.createPaymentIntent(request);
    revalidatePath("/");
    return { data, error: null };
  } catch (err) {
    console.error("[createPaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du payment intent",
    };
  }
}

/**
 * Update a payment intent via gRPC
 */
export async function updatePaymentIntent(
  request: UpdatePaymentIntentRequest
): Promise<ActionResult<PaymentIntentResponse>> {
  try {
    const data = await payments.updatePaymentIntent(request);
    revalidatePath("/");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du payment intent",
    };
  }
}

/**
 * Delete a payment intent via gRPC
 */
export async function deletePaymentIntent(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const request: GetByIdRequest = {
      id,
      societe_id: "", // Will be set by backend auth
    };
    await payments.deletePaymentIntent(request);
    revalidatePath("/");
    return { data: true, error: null };
  } catch (err) {
    console.error("[deletePaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du payment intent",
    };
  }
}

// ==================== PAYMENT EVENTS ====================

/**
 * Fetch payment events by payment intent ID via gRPC
 */
export async function getPaymentEvents(params: {
  paymentIntentId?: string;
  unprocessed?: boolean;
}): Promise<ActionResult<PaymentEventResponse[]>> {
  try {
    // Note: gRPC client doesn't have a list method yet
    // This is a placeholder that would need backend implementation
    // For now, return empty array
    return { data: [], error: null };
  } catch (err) {
    console.error("[getPaymentEvents] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des payment events",
    };
  }
}

/**
 * Fetch a single payment event by ID via gRPC
 */
export async function getPaymentEvent(
  id: string
): Promise<ActionResult<PaymentEventResponse>> {
  try {
    const request: GetByIdRequest = {
      id,
      societe_id: "", // Will be set by backend auth
    };
    const data = await payments.getPaymentEvent(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getPaymentEvent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du payment event",
    };
  }
}

/**
 * Create a payment event via gRPC
 */
export async function createPaymentEvent(
  request: CreatePaymentEventRequest
): Promise<ActionResult<PaymentEventResponse>> {
  try {
    const data = await payments.createPaymentEvent(request);
    revalidatePath("/");
    return { data, error: null };
  } catch (err) {
    console.error("[createPaymentEvent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du payment event",
    };
  }
}

/**
 * Update a payment event via gRPC
 */
export async function updatePaymentEvent(
  id: string,
  data: { processed?: boolean; processedAt?: string; errorMessage?: string }
): Promise<ActionResult<PaymentEventResponse>> {
  try {
    // Note: gRPC client doesn't have an update method yet
    // This is a placeholder that would need backend implementation
    return { data: null, error: "Mise à jour non implémentée" };
  } catch (err) {
    console.error("[updatePaymentEvent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du payment event",
    };
  }
}

/**
 * Delete a payment event via gRPC
 */
export async function deletePaymentEvent(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const request: GetByIdRequest = {
      id,
      societe_id: "", // Will be set by backend auth
    };
    await payments.deletePaymentEvent(request);
    revalidatePath("/");
    return { data: true, error: null };
  } catch (err) {
    console.error("[deletePaymentEvent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du payment event",
    };
  }
}

// ==================== SCHEDULES ====================

/**
 * Fetch schedules by facture or contract ID via gRPC
 */
export async function getSchedules(params: {
  factureId?: string;
  contratId?: string;
}): Promise<ActionResult<ScheduleResponse[]>> {
  try {
    // Note: gRPC client doesn't have a list method yet
    // This is a placeholder that would need backend implementation
    // For now, return empty array
    return { data: [], error: null };
  } catch (err) {
    console.error("[getSchedules] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des schedules",
    };
  }
}

/**
 * Fetch a single schedule by ID via gRPC
 */
export async function getSchedule(
  id: string
): Promise<ActionResult<ScheduleResponse>> {
  try {
    const request: GetByIdRequest = {
      id,
      societeId: "", // Will be set by backend auth
    };
    const data = await payments.getSchedule(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getSchedule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du schedule",
    };
  }
}

/**
 * Create a schedule via gRPC
 */
export async function createSchedule(
  request: CreateScheduleRequest
): Promise<ActionResult<ScheduleResponse>> {
  try {
    const data = await payments.createSchedule(request);
    revalidatePath("/");
    return { data, error: null };
  } catch (err) {
    console.error("[createSchedule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du schedule",
    };
  }
}

/**
 * Update a schedule via gRPC
 */
export async function updateSchedule(
  request: UpdateScheduleRequest
): Promise<ActionResult<ScheduleResponse>> {
  try {
    const data = await payments.updateSchedule(request);
    revalidatePath("/");
    return { data, error: null };
  } catch (err) {
    console.error("[updateSchedule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du schedule",
    };
  }
}

/**
 * Delete a schedule via gRPC
 */
export async function deleteSchedule(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const request: GetByIdRequest = {
      id,
      societe_id: "", // Will be set by backend auth
    };
    await payments.deleteSchedule(request);
    revalidatePath("/");
    return { data: true, error: null };
  } catch (err) {
    console.error("[deleteSchedule] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du schedule",
    };
  }
}

/**
 * Trigger manual payment processing for due schedules
 */
export async function triggerPaymentProcessing(): Promise<
  ActionResult<{ processed: number; failed: number }>
> {
  try {
    const data = await payments.triggerPaymentProcessing();
    revalidatePath("/");
    return { data, error: null };
  } catch (err) {
    console.error("[triggerPaymentProcessing] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du traitement des paiements",
    };
  }
}

// ==================== STRIPE ====================

/**
 * Create a Stripe Payment Intent via gRPC
 */
export async function createStripePaymentIntent(params: {
  societeId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<ActionResult<StripePaymentIntentResponse>> {
  try {
    const request: CreateStripePaymentIntentRequest = {
      societeId: params.societeId,
      amount: params.amount,
      currency: params.currency || "eur",
      customerId: params.customerId,
      description: params.description,
      confirm: false,
      automaticPaymentMethods: true,
      metadata: params.metadata || {},
    };
    const data = await payments.createStripePaymentIntent(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createStripePaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du payment intent Stripe",
    };
  }
}

/**
 * Get a Stripe Payment Intent by ID via gRPC
 */
export async function getStripePaymentIntent(
  id: string,
  societeId: string
): Promise<ActionResult<StripePaymentIntentResponse>> {
  try {
    const data = await payments.getStripePaymentIntent({ id, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getStripePaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du payment intent Stripe",
    };
  }
}

/**
 * Cancel a Stripe Payment Intent via gRPC
 */
export async function cancelStripePaymentIntent(
  id: string,
  societeId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await payments.cancelStripePaymentIntent({ id, societeId });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[cancelStripePaymentIntent] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation du payment intent Stripe",
    };
  }
}

/**
 * Create a Stripe Checkout Session via gRPC
 */
export async function createStripeCheckoutSession(params: {
  societeId: string;
  customerId?: string;
  customerEmail?: string;
  priceId?: string;
  amount?: number;
  currency?: string;
  mode: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    name?: string;
    description?: string;
    amount?: number;
    quantity: number;
    currency?: string;
  }>;
}): Promise<ActionResult<StripeCheckoutSessionResponse>> {
  try {
    const request: CreateStripeCheckoutSessionRequest = {
      societeId: params.societeId,
      amount: params.amount ? BigInt(params.amount) as unknown as number : 0,
      currency: params.currency || "eur",
      mode: params.mode,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      priceId: params.priceId,
      metadata: params.metadata || {},
      lineItems: (params.lineItems || []).map((item) => ({
        name: item.name || "",
        description: item.description || "",
        amount: item.amount || 0,
        quantity: item.quantity,
        currency: item.currency || params.currency || "eur",
      })),
    };
    const data = await payments.createStripeCheckoutSession(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createStripeCheckoutSession] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la session Stripe",
    };
  }
}

/**
 * Create a Stripe Customer via gRPC
 */
export async function createStripeCustomer(params: {
  societeId: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}): Promise<ActionResult<StripeCustomerResponse>> {
  try {
    const request: CreateStripeCustomerRequest = {
      societeId: params.societeId,
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata || {},
    };
    const data = await payments.createStripeCustomer(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createStripeCustomer] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du client Stripe",
    };
  }
}

/**
 * Get a Stripe Customer by ID via gRPC
 */
export async function getStripeCustomer(
  id: string,
  societeId: string
): Promise<ActionResult<StripeCustomerResponse>> {
  try {
    const data = await payments.getStripeCustomer({ id, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getStripeCustomer] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du client Stripe",
    };
  }
}

/**
 * Create a Stripe Subscription via gRPC
 */
export async function createStripeSubscription(params: {
  societeId: string;
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}): Promise<ActionResult<StripeSubscriptionResponse>> {
  try {
    const request: CreateStripeSubscriptionRequest = {
      societeId: params.societeId,
      customerId: params.customerId,
      priceId: params.priceId,
      metadata: params.metadata || {},
    };
    const data = await payments.createStripeSubscription(request);
    return { data, error: null };
  } catch (err) {
    console.error("[createStripeSubscription] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'abonnement Stripe",
    };
  }
}

/**
 * Get a Stripe Subscription by ID via gRPC
 */
export async function getStripeSubscription(
  id: string,
  societeId: string
): Promise<ActionResult<StripeSubscriptionResponse>> {
  try {
    const data = await payments.getStripeSubscription({ id, societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getStripeSubscription] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération de l'abonnement Stripe",
    };
  }
}

/**
 * Cancel a Stripe Subscription via gRPC
 */
export async function cancelStripeSubscription(
  id: string,
  societeId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await payments.cancelStripeSubscription({ id, societeId });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[cancelStripeSubscription] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation de l'abonnement Stripe",
    };
  }
}

/**
 * Create a Stripe Refund via gRPC
 */
export async function createStripeRefund(params: {
  societeId: string;
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const request: CreateStripeRefundRequest = {
      societeId: params.societeId,
      paymentIntentId: params.paymentIntentId,
      amount: params.amount,
      reason: params.reason,
    };
    await payments.createStripeRefund(request);
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[createStripeRefund] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du remboursement Stripe",
    };
  }
}

// ==================== PSP ACCOUNTS ====================

export type { PSPAccountsSummaryResponse, PSPAccountInfo };

/**
 * Get PSP accounts summary for a societe via gRPC
 */
export async function getPSPAccountsSummary(
  societeId: string
): Promise<ActionResult<PSPAccountsSummaryResponse>> {
  try {
    const data = await payments.getPSPAccountsSummary({ societeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getPSPAccountsSummary] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des comptes PSP",
    };
  }
}

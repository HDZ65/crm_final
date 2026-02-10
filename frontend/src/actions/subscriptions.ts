"use server";

import { revalidatePath } from "next/cache";
import {
  subscriptionPlans,
  subscriptions,
  subscriptionPreferenceSchemas,
  subscriptionPreferences,
} from "@/lib/grpc";
import type { ActionResult } from "@/lib/types/common";
import type {
  SubscriptionPlan,
  ListSubscriptionPlanResponse,
  Subscription,
  ListSubscriptionResponse,
  PreferenceSchema,
  ListPreferenceSchemaResponse,
  Preference,
  ListPreferenceResponse,
  DeleteResponse,
} from "@proto/subscriptions/subscriptions";

// ============================================================================
// SubscriptionPlan Actions
// ============================================================================

export async function getSubscriptionPlan(id: string): Promise<ActionResult<SubscriptionPlan>> {
  try {
    const data = await subscriptionPlans.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getSubscriptionPlan] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du plan d'abonnement" };
  }
}

export async function listSubscriptionPlans(): Promise<ActionResult<ListSubscriptionPlanResponse>> {
  try {
    const data = await subscriptionPlans.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listSubscriptionPlans] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des plans d'abonnement" };
  }
}

export async function listSubscriptionPlansByOrganisation(organisationId: string): Promise<ActionResult<ListSubscriptionPlanResponse>> {
  try {
    const data = await subscriptionPlans.listByOrganisation({ organisationId, pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listSubscriptionPlansByOrganisation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des plans d'abonnement" };
  }
}

export async function createSubscriptionPlan(input: {
  organisationId: string;
  code: string;
  name: string;
  description: string;
  planType: number;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  billingInterval: number;
  billingCycleDays: number;
  trialDays: number;
  features: string;
}): Promise<ActionResult<SubscriptionPlan>> {
  try {
    const data = await subscriptionPlans.create(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[createSubscriptionPlan] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du plan d'abonnement" };
  }
}

export async function updateSubscriptionPlan(input: {
  id: string;
  name?: string;
  description?: string;
  priceMonthly?: number;
  priceAnnual?: number;
  currency?: string;
  billingInterval?: number;
  billingCycleDays?: number;
  trialDays?: number;
  features?: string;
  isActive?: boolean;
}): Promise<ActionResult<SubscriptionPlan>> {
  try {
    const data = await subscriptionPlans.update(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[updateSubscriptionPlan] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du plan d'abonnement" };
  }
}

export async function deleteSubscriptionPlan(id: string): Promise<ActionResult<DeleteResponse>> {
  try {
    const data = await subscriptionPlans.delete({ id });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteSubscriptionPlan] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du plan d'abonnement" };
  }
}

// ============================================================================
// Subscription Actions
// ============================================================================

export async function getSubscription(id: string): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de l'abonnement" };
  }
}

export async function listSubscriptions(params: {
  organisationId: string;
  clientId?: string;
  planId?: string;
  status?: number;
  storeSource?: number;
  planType?: number;
  search?: string;
}): Promise<ActionResult<ListSubscriptionResponse>> {
  try {
    const data = await subscriptions.list({
      organisationId: params.organisationId,
      clientId: params.clientId,
      planId: params.planId,
      status: params.status,
      storeSource: params.storeSource,
      planType: params.planType,
      search: params.search,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listSubscriptions] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des abonnements" };
  }
}

export async function listSubscriptionsByClient(clientId: string): Promise<ActionResult<ListSubscriptionResponse>> {
  try {
    const data = await subscriptions.listByClient({ clientId, pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listSubscriptionsByClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des abonnements du client" };
  }
}

export async function listSubscriptionsByPlan(planId: string): Promise<ActionResult<ListSubscriptionResponse>> {
  try {
    const data = await subscriptions.listByPlan({ planId, pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listSubscriptionsByPlan] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des abonnements du plan" };
  }
}

export async function createSubscription(input: {
  organisationId: string;
  clientId: string;
  planId: string;
  planType: number;
  frequency: number;
  storeSource: number;
  startDate: string;
  imsSubscriptionId?: string;
  couponId?: string;
  cancellationReason?: string;
}): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.create(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[createSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de l'abonnement" };
  }
}

export async function updateSubscription(input: {
  id: string;
  planId?: string;
  planType?: number;
  frequency?: number;
  startDate?: string;
  endDate?: string;
  addOns?: string;
  cancelAtPeriodEnd?: boolean;
}): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.update(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[updateSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de l'abonnement" };
  }
}

export async function deleteSubscription(id: string): Promise<ActionResult<DeleteResponse>> {
  try {
    const data = await subscriptions.delete({ id });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de l'abonnement" };
  }
}

export async function activateSubscription(id: string, triggeredBy: number): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.activate({ id, triggeredBy });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[activateSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'activation de l'abonnement" };
  }
}

export async function pauseSubscription(id: string, triggeredBy: number, reason?: string): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.pause({ id, triggeredBy, reason });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[pauseSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise en pause de l'abonnement" };
  }
}

export async function resumeSubscription(id: string, triggeredBy: number): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.resume({ id, triggeredBy });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[resumeSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la reprise de l'abonnement" };
  }
}

export async function cancelSubscription(id: string, triggeredBy: number, reason?: string): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.cancel({ id, triggeredBy, reason });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[cancelSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'annulation de l'abonnement" };
  }
}

export async function suspendSubscription(id: string, triggeredBy: number, reason?: string): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.suspend({ id, triggeredBy, reason });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[suspendSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suspension de l'abonnement" };
  }
}

export async function reactivateSubscription(id: string, triggeredBy: number): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.reactivate({ id, triggeredBy });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[reactivateSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la réactivation de l'abonnement" };
  }
}

export async function expireSubscription(id: string): Promise<ActionResult<Subscription>> {
  try {
    const data = await subscriptions.expire({ id });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[expireSubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'expiration de l'abonnement" };
  }
}

export async function getSubscriptionsDueForCharge(organisationId: string, beforeDate?: string): Promise<ActionResult<ListSubscriptionResponse>> {
  try {
    const data = await subscriptions.getDueForCharge({ organisationId, beforeDate });
    return { data, error: null };
  } catch (err) {
    console.error("[getSubscriptionsDueForCharge] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des abonnements à facturer" };
  }
}

export async function getSubscriptionsDueForTrialConversion(organisationId: string): Promise<ActionResult<ListSubscriptionResponse>> {
  try {
    const data = await subscriptions.getDueForTrialConversion({ organisationId });
    return { data, error: null };
  } catch (err) {
    console.error("[getSubscriptionsDueForTrialConversion] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des abonnements en conversion d'essai" };
  }
}

// ============================================================================
// SubscriptionPreferenceSchema Actions
// ============================================================================

export async function getPreferenceSchema(id: string): Promise<ActionResult<PreferenceSchema>> {
  try {
    const data = await subscriptionPreferenceSchemas.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPreferenceSchema] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du schéma de préférence" };
  }
}

export async function listPreferenceSchemas(): Promise<ActionResult<ListPreferenceSchemaResponse>> {
  try {
    const data = await subscriptionPreferenceSchemas.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listPreferenceSchemas] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des schémas de préférence" };
  }
}

export async function createPreferenceSchema(input: {
  organisationId: string;
  name: string;
  description: string;
  fields: Array<{ name: string; type: string; label: string; required: boolean; defaultValue?: string; enumValues: string[] }>;
}): Promise<ActionResult<PreferenceSchema>> {
  try {
    const data = await subscriptionPreferenceSchemas.create(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[createPreferenceSchema] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du schéma de préférence" };
  }
}

export async function updatePreferenceSchema(input: {
  id: string;
  name?: string;
  description?: string;
  fields: Array<{ name: string; type: string; label: string; required: boolean; defaultValue?: string; enumValues: string[] }>;
  isActive?: boolean;
}): Promise<ActionResult<PreferenceSchema>> {
  try {
    const data = await subscriptionPreferenceSchemas.update(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePreferenceSchema] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du schéma de préférence" };
  }
}

export async function deletePreferenceSchema(id: string): Promise<ActionResult<DeleteResponse>> {
  try {
    const data = await subscriptionPreferenceSchemas.delete({ id });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[deletePreferenceSchema] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du schéma de préférence" };
  }
}

// ============================================================================
// SubscriptionPreference Actions
// ============================================================================

export async function getPreference(id: string): Promise<ActionResult<Preference>> {
  try {
    const data = await subscriptionPreferences.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPreference] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la préférence" };
  }
}

export async function getPreferenceBySubscription(subscriptionId: string): Promise<ActionResult<Preference>> {
  try {
    const data = await subscriptionPreferences.getBySubscription({ subscriptionId });
    return { data, error: null };
  } catch (err) {
    console.error("[getPreferenceBySubscription] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la préférence de l'abonnement" };
  }
}

export async function listPreferences(): Promise<ActionResult<ListPreferenceResponse>> {
  try {
    const data = await subscriptionPreferences.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listPreferences] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des préférences" };
  }
}

export async function createPreference(input: {
  subscriptionId: string;
  schemaId: string;
  values: Record<string, string>;
}): Promise<ActionResult<Preference>> {
  try {
    const data = await subscriptionPreferences.create(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[createPreference] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la préférence" };
  }
}

export async function updatePreference(input: {
  id: string;
  values: Record<string, string>;
}): Promise<ActionResult<Preference>> {
  try {
    const data = await subscriptionPreferences.update(input);
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePreference] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la préférence" };
  }
}

export async function deletePreference(id: string): Promise<ActionResult<DeleteResponse>> {
  try {
    const data = await subscriptionPreferences.delete({ id });
    revalidatePath("/subscriptions");
    return { data, error: null };
  } catch (err) {
    console.error("[deletePreference] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la préférence" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import {
  woocommerceWebhooks,
  woocommerceMappings,
  woocommerceConfig,
} from "@/lib/grpc";
import type { ActionResult } from "@/lib/types/common";
import type {
  WooCommerceWebhookEvent,
  ProcessWebhookResponse,
  ListWebhookEventsResponse,
  WooCommerceMapping,
  ListWooCommerceMappingResponse,
  WooCommerceConfig,
  TestWooCommerceConnectionResponse,
  WooCommerceDeleteResponse,
} from "@proto/woocommerce/woocommerce";

// ============================================================================
// WooCommerce Webhook Actions
// ============================================================================

export async function processWooCommerceWebhook(input: {
  organisationId: string;
  topic: string;
  resource: string;
  externalId: string;
  payload: string;
  signature: string;
}): Promise<ActionResult<ProcessWebhookResponse>> {
  try {
    const data = await woocommerceWebhooks.processWebhook(input);
    return { data, error: null };
  } catch (err) {
    console.error("[processWooCommerceWebhook] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du traitement du webhook WooCommerce" };
  }
}

export async function listWooCommerceWebhookEvents(params: {
  organisationId: string;
  topic?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult<ListWebhookEventsResponse>> {
  try {
    const data = await woocommerceWebhooks.listEvents({
      organisationId: params.organisationId,
      topic: params.topic || "",
      status: params.status || "",
      search: params.search || "",
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listWooCommerceWebhookEvents] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des événements webhook" };
  }
}

export async function getWooCommerceWebhookEvent(id: string): Promise<ActionResult<WooCommerceWebhookEvent>> {
  try {
    const data = await woocommerceWebhooks.getEvent({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getWooCommerceWebhookEvent] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de l'événement webhook" };
  }
}

export async function retryWooCommerceWebhookEvent(id: string): Promise<ActionResult<ProcessWebhookResponse>> {
  try {
    const data = await woocommerceWebhooks.retryEvent({ id });
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[retryWooCommerceWebhookEvent] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du rejeu de l'événement webhook" };
  }
}

// ============================================================================
// WooCommerce Mapping Actions
// ============================================================================

export async function getWooCommerceMapping(id: string): Promise<ActionResult<WooCommerceMapping>> {
  try {
    const data = await woocommerceMappings.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getWooCommerceMapping] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du mapping WooCommerce" };
  }
}

export async function getWooCommerceMappingByExternalId(params: {
  organisationId: string;
  entityType: string;
  externalId: string;
}): Promise<ActionResult<WooCommerceMapping>> {
  try {
    const data = await woocommerceMappings.getByExternalId(params);
    return { data, error: null };
  } catch (err) {
    console.error("[getWooCommerceMappingByExternalId] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du mapping WooCommerce" };
  }
}

export async function listWooCommerceMappings(params: {
  organisationId: string;
  entityType?: string;
  syncStatus?: string;
  search?: string;
}): Promise<ActionResult<ListWooCommerceMappingResponse>> {
  try {
    const data = await woocommerceMappings.list({
      organisationId: params.organisationId,
      entityType: params.entityType || "",
      syncStatus: params.syncStatus || "",
      search: params.search || "",
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listWooCommerceMappings] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des mappings WooCommerce" };
  }
}

export async function createWooCommerceMapping(input: {
  organisationId: string;
  entityType: string;
  externalId: string;
  internalId: string;
  externalData: string;
}): Promise<ActionResult<WooCommerceMapping>> {
  try {
    const data = await woocommerceMappings.create(input);
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[createWooCommerceMapping] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du mapping WooCommerce" };
  }
}

export async function updateWooCommerceMapping(input: {
  id: string;
  internalId: string;
  externalData: string;
  syncStatus: string;
}): Promise<ActionResult<WooCommerceMapping>> {
  try {
    const data = await woocommerceMappings.update(input);
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[updateWooCommerceMapping] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du mapping WooCommerce" };
  }
}

export async function deleteWooCommerceMapping(id: string): Promise<ActionResult<WooCommerceDeleteResponse>> {
  try {
    const data = await woocommerceMappings.delete({ id });
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteWooCommerceMapping] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du mapping WooCommerce" };
  }
}

// ============================================================================
// WooCommerce Config Actions
// ============================================================================

export async function getWooCommerceConfig(id: string): Promise<ActionResult<WooCommerceConfig>> {
  try {
    const data = await woocommerceConfig.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getWooCommerceConfig] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la configuration WooCommerce" };
  }
}

export async function getWooCommerceConfigByOrganisation(organisationId: string): Promise<ActionResult<WooCommerceConfig>> {
  try {
    const data = await woocommerceConfig.getByOrganisation({ organisationId });
    return { data, error: null };
  } catch (err) {
    console.error("[getWooCommerceConfigByOrganisation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la configuration WooCommerce" };
  }
}

export async function createWooCommerceConfig(input: {
  organisationId: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret: string;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
}): Promise<ActionResult<WooCommerceConfig>> {
  try {
    const data = await woocommerceConfig.create(input);
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[createWooCommerceConfig] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la configuration WooCommerce" };
  }
}

export async function updateWooCommerceConfig(input: {
  id: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret: string;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  active: boolean;
}): Promise<ActionResult<WooCommerceConfig>> {
  try {
    const data = await woocommerceConfig.update(input);
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[updateWooCommerceConfig] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la configuration WooCommerce" };
  }
}

export async function deleteWooCommerceConfig(id: string): Promise<ActionResult<WooCommerceDeleteResponse>> {
  try {
    const data = await woocommerceConfig.delete({ id });
    revalidatePath("/woocommerce");
    return { data, error: null };
  } catch (err) {
    console.error("[deleteWooCommerceConfig] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la configuration WooCommerce" };
  }
}

export async function testWooCommerceConnection(organisationId: string): Promise<ActionResult<TestWooCommerceConnectionResponse>> {
  try {
    const data = await woocommerceConfig.testConnection({ organisationId });
    return { data, error: null };
  } catch (err) {
    console.error("[testWooCommerceConnection] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du test de connexion WooCommerce" };
  }
}

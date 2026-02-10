"use server";

import { bundle } from "@/lib/grpc/clients";
import type {
  GetConfigurationRequest,
  GetConfigurationResponse,
  ListConfigurationsRequest,
  ListConfigurationsResponse,
  BundleCalculatePriceRequest,
  BundleCalculatePriceResponse,
} from "@proto/services/bundle";
import type { ActionResult } from "@/lib/types/common";

/**
 * Get bundle configuration by ID
 */
export async function getConfiguration(
  params: GetConfigurationRequest
): Promise<ActionResult<GetConfigurationResponse>> {
  try {
    const data = await bundle.getConfiguration(params);
    return { data, error: null };
  } catch (err) {
    console.error("[getConfiguration] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la configuration",
    };
  }
}

/**
 * List bundle configurations for an organisation
 */
export async function listConfigurations(
  params: ListConfigurationsRequest
): Promise<ActionResult<ListConfigurationsResponse>> {
  try {
    const data = await bundle.listConfigurations(params);
    return { data, error: null };
  } catch (err) {
    console.error("[listConfigurations] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des configurations",
    };
  }
}

/**
 * Calculate bundle price with discounts
 */
export async function calculatePrice(
  params: BundleCalculatePriceRequest
): Promise<ActionResult<BundleCalculatePriceResponse>> {
  try {
    const data = await bundle.calculatePrice(params);
    return { data, error: null };
  } catch (err) {
    console.error("[calculatePrice] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du calcul du prix",
    };
  }
}

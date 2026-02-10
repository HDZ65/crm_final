"use server";

import { dashboard, commercialKpis, alertes } from "@/lib/grpc";
import type {
  KpisResponse,
  EvolutionCaResponse,
  RepartitionProduitsResponse,
  StatsSocietesResponse,
  KpisCommerciauxResponse,
  AlertesResponse,
  DashboardFilters,
} from "@proto/dashboard/dashboard";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch KPIs du dashboard via gRPC
 */
export async function getDashboardKpis(
  filters: DashboardFilters
): Promise<ActionResult<KpisResponse>> {
  try {
    const data = await dashboard.getKpis({ filters });
    return { data, error: null };
  } catch (err) {
    console.error("[getDashboardKpis] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des KPIs",
    };
  }
}

/**
 * Fetch évolution du CA via gRPC
 */
export async function getEvolutionCa(
  filters: DashboardFilters
): Promise<ActionResult<EvolutionCaResponse>> {
  try {
    const data = await dashboard.getEvolutionCa({ filters });
    return { data, error: null };
  } catch (err) {
    console.error("[getEvolutionCa] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de l'évolution CA",
    };
  }
}

/**
 * Fetch répartition des produits via gRPC
 */
export async function getRepartitionProduits(
  filters: DashboardFilters
): Promise<ActionResult<RepartitionProduitsResponse>> {
  try {
    const data = await dashboard.getRepartitionProduits({ filters });
    return { data, error: null };
  } catch (err) {
    console.error("[getRepartitionProduits] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la répartition",
    };
  }
}

/**
 * Fetch statistiques par société via gRPC
 */
export async function getStatsSocietes(
  filters: DashboardFilters
): Promise<ActionResult<StatsSocietesResponse>> {
  try {
    const data = await dashboard.getStatsSocietes({ filters });
    return { data, error: null };
  } catch (err) {
    console.error("[getStatsSocietes] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des stats sociétés",
    };
  }
}

/**
 * Fetch toutes les données du dashboard en parallèle
 */
export async function getDashboardData(filters: DashboardFilters): Promise<{
  kpis: ActionResult<KpisResponse>;
  evolutionCa: ActionResult<EvolutionCaResponse>;
  repartitionProduits: ActionResult<RepartitionProduitsResponse>;
  statsSocietes: ActionResult<StatsSocietesResponse>;
}> {
  const [kpis, evolutionCa, repartitionProduits, statsSocietes] = await Promise.all([
    getDashboardKpis(filters),
    getEvolutionCa(filters),
    getRepartitionProduits(filters),
    getStatsSocietes(filters),
  ]);

  return { kpis, evolutionCa, repartitionProduits, statsSocietes };
}

/**
 * Fetch KPIs commerciaux via gRPC
 */
export async function getKpisCommerciaux(
  filters: DashboardFilters
): Promise<ActionResult<KpisCommerciauxResponse>> {
  try {
    const data = await commercialKpis.getKpisCommerciaux({ filters });
    return { data, error: null };
  } catch (err) {
    console.error("[getKpisCommerciaux] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des KPIs commerciaux",
    };
  }
}

/**
 * Fetch alertes via gRPC
 */
export async function getAlertes(
  filters: DashboardFilters
): Promise<ActionResult<AlertesResponse>> {
  try {
    const data = await alertes.getAlertes({ filters });
    return { data, error: null };
  } catch (err) {
    console.error("[getAlertes] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des alertes",
    };
  }
}

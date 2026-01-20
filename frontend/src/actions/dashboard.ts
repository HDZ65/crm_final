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
} from "@proto-frontend/dashboard/dashboard";

export interface DashboardActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch KPIs du dashboard via gRPC
 */
export async function getDashboardKpis(
  filters: DashboardFilters
): Promise<DashboardActionResult<KpisResponse>> {
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
): Promise<DashboardActionResult<EvolutionCaResponse>> {
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
): Promise<DashboardActionResult<RepartitionProduitsResponse>> {
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
): Promise<DashboardActionResult<StatsSocietesResponse>> {
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
  kpis: DashboardActionResult<KpisResponse>;
  evolutionCa: DashboardActionResult<EvolutionCaResponse>;
  repartitionProduits: DashboardActionResult<RepartitionProduitsResponse>;
  statsSocietes: DashboardActionResult<StatsSocietesResponse>;
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
): Promise<DashboardActionResult<KpisCommerciauxResponse>> {
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
): Promise<DashboardActionResult<AlertesResponse>> {
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

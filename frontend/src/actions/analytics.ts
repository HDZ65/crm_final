"use server";

import { payments } from "@/lib/grpc";
import type {
  RejectionTrend,
  DayHeatmapEntry,
  ClientScore,
  ForecastVsActual,
  OptimizationSuggestion,
  AnalyticsTimeRange,
} from "@/lib/ui/display-types/payment";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch rejection trends for a given time range
 * Returns monthly rejection rate trends
 */
export async function fetchRejectionTrends(
  societeId: string,
  timeRange: AnalyticsTimeRange
): Promise<ActionResult<RejectionTrend[]>> {
  try {
    // Note: No dedicated getRejectionTrends RPC available in gRPC client
    // This would require backend implementation to aggregate payment rejection data by month
    // For now, return empty array to prevent UI crashes
    return { data: [], error: null };
  } catch (err) {
    console.error("[fetchRejectionTrends] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des tendances de rejet",
    };
  }
}

/**
 * Fetch heatmap data for day-of-month rejection rates
 * Returns rejection intensity for each day of the month
 */
export async function fetchHeatmapData(
  societeId: string,
  timeRange: AnalyticsTimeRange
): Promise<ActionResult<DayHeatmapEntry[]>> {
  try {
    // Note: No dedicated getHeatmapData RPC available in gRPC client
    // This would require backend implementation to aggregate payment rejection data by day of month
    // For now, return empty array to prevent UI crashes
    return { data: [], error: null };
  } catch (err) {
    console.error("[fetchHeatmapData] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la heatmap",
    };
  }
}

/**
 * Fetch client scores for top/flop analysis
 * Returns success rates and risk tiers for each client
 */
export async function fetchClientScores(
  societeId: string,
  timeRange: AnalyticsTimeRange
): Promise<ActionResult<ClientScore[]>> {
  try {
    // Note: No dedicated getClientScores RPC available in gRPC client
    // This would require backend implementation to calculate client-level success rates and risk scoring
    // For now, return empty array to prevent UI crashes
    return { data: [], error: null };
  } catch (err) {
    console.error("[fetchClientScores] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des scores clients",
    };
  }
}

/**
 * Fetch forecast vs actual data
 * Returns expected vs actual payment counts and amounts by month
 */
export async function fetchForecastData(
  societeId: string,
  timeRange: AnalyticsTimeRange
): Promise<ActionResult<ForecastVsActual[]>> {
  try {
    // Note: No dedicated getForecastData RPC available in gRPC client
    // This would require backend implementation to provide forecast/prediction data
    // For now, return empty array to prevent UI crashes
    return { data: [], error: null };
  } catch (err) {
    console.error("[fetchForecastData] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des prévisions",
    };
  }
}

/**
 * Fetch optimization suggestions for a given societe
 * Returns suggestions for lot changes to reduce rejections
 */
export async function fetchOptimizationSuggestions(
  societeId: string
): Promise<ActionResult<OptimizationSuggestion[]>> {
  try {
    // Note: No dedicated getOptimizationSuggestions RPC available in gRPC client
    // This would require backend implementation to analyze payment patterns and suggest lot changes
    // For now, return empty array to prevent UI crashes
    return { data: [], error: null };
  } catch (err) {
    console.error("[fetchOptimizationSuggestions] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des suggestions d'optimisation",
    };
  }
}

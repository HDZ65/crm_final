"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import type {
  DashboardKPIsResponse,
  StatsFilters,
  KPICard,
} from "@/types/stats"

interface UseDashboardKPIsOptions {
  filters?: StatsFilters
  skip?: boolean
}

interface UseDashboardKPIsReturn {
  data: DashboardKPIsResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  // Transformed data for components
  kpiCards: KPICard[]
}

const ENDPOINT = "/dashboard/kpis"

/**
 * Hook for fetching dashboard KPIs
 * GET /dashboard/kpis
 */
export function useDashboardKPIs(
  options: UseDashboardKPIsOptions = {}
): UseDashboardKPIsReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<DashboardKPIsResponse | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<ApiError | null>(null)

  const buildQueryString = useCallback((f?: StatsFilters): string => {
    if (!f) return ""
    const params = new URLSearchParams()
    Object.entries(f).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value))
      }
    })
    const result = params.toString()
    return result ? `?${result}` : ""
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryString = buildQueryString(filters)
      const result = await api.get(`${ENDPOINT}${queryString}`)
      setData(result)
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError("Failed to fetch KPIs", 0)
      setError(apiError)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [filters, buildQueryString])

  useEffect(() => {
    if (!skip) {
      fetchData()
    }
  }, [fetchData, skip])

  // Transform API response to KPICard format for component compatibility
  const kpiCards: KPICard[] = data
    ? [
        {
          label: "Contrats actifs",
          value: data.contratsActifs,
          evolution: data.contratsActifsVariation.pourcentage,
          format: "number" as const,
          status:
            data.contratsActifsVariation.tendance === "hausse"
              ? "success"
              : data.contratsActifsVariation.tendance === "baisse"
              ? "danger"
              : "neutral",
        },
        {
          label: "MRR",
          value: data.mrr,
          evolution: data.mrrVariation.pourcentage,
          format: "currency" as const,
          status:
            data.mrrVariation.tendance === "hausse"
              ? "success"
              : data.mrrVariation.tendance === "baisse"
              ? "danger"
              : "neutral",
        },
        {
          label: "Taux de churn",
          value: data.tauxChurn,
          evolution: data.tauxChurnVariation.pourcentage,
          format: "percentage" as const,
          status:
            data.tauxChurnVariation.tendance === "baisse"
              ? "success"
              : data.tauxChurnVariation.tendance === "hausse"
              ? "warning"
              : "neutral",
        },
        {
          label: "Taux d'impayés",
          value: data.tauxImpayes,
          evolution: data.tauxImpayesVariation.pourcentage,
          format: "percentage" as const,
          status:
            data.tauxImpayesVariation.tendance === "baisse"
              ? "success"
              : data.tauxImpayesVariation.tendance === "hausse"
              ? "warning"
              : "neutral",
        },
      ]
    : []

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    kpiCards,
  }
}

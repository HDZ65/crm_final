"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import type {
  CAEvolutionResponse,
  CAEvolution,
  StatsFilters,
} from "@/types/stats"

interface UseCAEvolutionOptions {
  filters?: StatsFilters
  skip?: boolean
}

interface UseCAEvolutionReturn {
  data: CAEvolutionResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  // Transformed data for chart components
  chartData: CAEvolution[]
}

const ENDPOINT = "/dashboard/evolution-ca"

/**
 * Hook for fetching CA evolution data
 * GET /dashboard/evolution-ca
 */
export function useCAEvolution(
  options: UseCAEvolutionOptions = {}
): UseCAEvolutionReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<CAEvolutionResponse | null>(null)
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
      const result = await api.get<CAEvolutionResponse>(`${ENDPOINT}${queryString}`)
      setData(result)
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError("Failed to fetch CA evolution", 0)
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

  // Transform API response to legacy format for chart components
  const chartData: CAEvolution[] = data
    ? data.donnees.map((item) => ({
        mois: item.mois,
        ca: item.caRealise,
        objectif: item.objectif,
      }))
    : []

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    chartData,
  }
}

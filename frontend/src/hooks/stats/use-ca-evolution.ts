"use client"

import { useCallback, useEffect, useState, useRef } from "react"
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

function buildQueryString(f?: StatsFilters): string {
  if (!f) return ""
  const params = new URLSearchParams()
  Object.entries(f).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value))
    }
  })
  const result = params.toString()
  return result ? `?${result}` : ""
}

/**
 * Hook for fetching CA evolution data
 * GET /dashboard/evolution-ca
 */
export function useCAEvolution(
  options: UseCAEvolutionOptions = {}
): UseCAEvolutionReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<CAEvolutionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // Stabilize filters reference using JSON serialization
  const filtersKey = JSON.stringify(filters ?? {})
  const hasFetched = useRef(false)
  const lastFiltersKey = useRef<string>("")

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  useEffect(() => {
    if (skip) {
      hasFetched.current = false
      return
    }

    // Only fetch if filters changed or first mount
    if (!hasFetched.current || lastFiltersKey.current !== filtersKey) {
      hasFetched.current = true
      lastFiltersKey.current = filtersKey
      fetchData()
    }
  }, [fetchData, skip, filtersKey])

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

"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { api, ApiError } from "@/lib/api"
import type {
  ProductDistributionResponse,
  ProductStats,
  StatsFilters,
} from "@/types/stats"

interface UseProductDistributionOptions {
  filters?: StatsFilters
  skip?: boolean
}

interface UseProductDistributionReturn {
  data: ProductDistributionResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  // Transformed data for chart components
  chartData: ProductStats[]
  caTotal: number
}

const ENDPOINT = "/dashboard/repartition-produits"

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
 * Hook for fetching product distribution data
 * GET /dashboard/repartition-produits
 */
export function useProductDistribution(
  options: UseProductDistributionOptions = {}
): UseProductDistributionReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<ProductDistributionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // Stabilize filters reference using JSON serialization
  const filtersKey = JSON.stringify(filters ?? {})
  const hasFetched = useRef(false)
  const lastFiltersKey = useRef<string>("")

  const fetchData = useCallback(async () => {
    setError(null)
    setLoading(true)

    try {
      const queryString = buildQueryString(filters)
      const result = await api.get<ProductDistributionResponse>(`${ENDPOINT}${queryString}`)
      setData(result)
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError("Failed to fetch product distribution", 0)
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
  const chartData: ProductStats[] = data
    ? data.produits.map((item) => ({
        produit: item.nomProduit,
        contratsActifs: 0, // Not provided by this API
        ca: item.ca,
        nouveauxClients: 0, // Not provided by this API
      }))
    : []

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    chartData,
    caTotal: data?.caTotal ?? 0,
  }
}

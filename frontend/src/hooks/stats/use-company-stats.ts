"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { api, ApiError } from "@/lib/api"
import type {
  CompanyStatsResponse,
  CompanyStats,
  StatsFilters,
} from "@/types/stats"

interface UseCompanyStatsOptions {
  filters?: StatsFilters
  skip?: boolean
}

interface UseCompanyStatsReturn {
  data: CompanyStatsResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  // Transformed data for table components
  tableData: CompanyStats[]
  total: number
}

const ENDPOINT = "/dashboard/stats-societes"

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
 * Hook for fetching company statistics
 * GET /dashboard/stats-societes
 */
export function useCompanyStats(
  options: UseCompanyStatsOptions = {}
): UseCompanyStatsReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<CompanyStatsResponse | null>(null)
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
      const result = await api.get<CompanyStatsResponse>(`${ENDPOINT}${queryString}`)
      setData(result)
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError("Failed to fetch company stats", 0)
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

  // Transform API response to legacy format for table components
  const tableData: CompanyStats[] = data
    ? data.societes.map((item) => ({
        companyId: item.societeId,
        companyName: item.nomSociete,
        contratsActifs: item.contratsActifs,
        mrr: item.mrr,
        arr: item.arr,
        nouveauxClients: item.nouveauxClients,
        tauxChurn: item.tauxChurn,
        tauxImpayes: item.tauxImpayes,
      }))
    : []

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    tableData,
    total: data?.total ?? 0,
  }
}

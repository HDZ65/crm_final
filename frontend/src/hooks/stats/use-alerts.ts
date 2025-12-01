"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import type { AlertsResponse, Alert, StatsFilters } from "@/types/stats"

interface UseAlertsOptions {
  filters?: StatsFilters
  skip?: boolean
}

interface UseAlertsReturn {
  data: AlertsResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  // Transformed data for alert components
  alerts: Alert[]
  counts: {
    total: number
    critiques: number
    avertissements: number
    infos: number
  }
}

const ENDPOINT = "/dashboard/alertes"

// Map API alert types to legacy types
const mapAlertType = (
  type: string
): "impaye" | "churn" | "cq" | "doublon" => {
  switch (type) {
    case "taux_impayes":
      return "impaye"
    case "taux_churn":
      return "churn"
    case "controles_qualite":
      return "cq"
    case "doublon":
      return "doublon"
    default:
      return "cq"
  }
}

// Map API severity to legacy severity
const mapSeverity = (niveau: string): "warning" | "danger" => {
  switch (niveau) {
    case "critique":
      return "danger"
    case "avertissement":
    case "info":
    default:
      return "warning"
  }
}

/**
 * Hook for fetching dashboard alerts
 * GET /dashboard/alertes
 */
export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<AlertsResponse | null>(null)
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
      const result = await api.get<AlertsResponse>(`${ENDPOINT}${queryString}`)
      setData(result)
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError("Failed to fetch alerts", 0)
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

  // Transform API response to legacy format for alert components
  const alerts: Alert[] = data
    ? data.alertes.map((item) => ({
        id: item.id,
        type: mapAlertType(item.type),
        severity: mapSeverity(item.niveau),
        title: item.titre,
        description: item.description,
        value: item.valeurActuelle,
        threshold: item.seuil,
        date: new Date(item.dateDetection),
      }))
    : []

  const counts = {
    total: data?.total ?? 0,
    critiques: data?.nombreCritiques ?? 0,
    avertissements: data?.nombreAvertissements ?? 0,
    infos: data?.nombreInfos ?? 0,
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    alerts,
    counts,
  }
}

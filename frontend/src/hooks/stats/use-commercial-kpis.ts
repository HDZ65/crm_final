"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import type {
  CommercialKPIsResponse,
  StatsFilters,
  KPICard,
  CommercialRanking,
} from "@/types/stats"

interface UseCommercialKPIsOptions {
  filters?: StatsFilters
  skip?: boolean
}

interface UseCommercialKPIsReturn {
  data: CommercialKPIsResponse | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  // Transformed data for components
  kpiCards: KPICard[]
  // Commercial rankings transformed to legacy format
  commercialRankings: CommercialRanking[]
}

const ENDPOINT = "/dashboard/kpis-commerciaux"

/**
 * Hook for fetching commercial KPIs
 * GET /dashboard/kpis-commerciaux
 */
export function useCommercialKPIs(
  options: UseCommercialKPIsOptions = {}
): UseCommercialKPIsReturn {
  const { filters, skip = false } = options

  const [data, setData] = useState<CommercialKPIsResponse | null>(null)
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
      const result = await api.get<CommercialKPIsResponse>(`${ENDPOINT}${queryString}`)
      setData(result)
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError("Failed to fetch commercial KPIs", 0)
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
          label: "Nouveaux clients (mois)",
          value: data.nouveauxClientsMois,
          evolution: data.nouveauxClientsVariation.pourcentage,
          format: "number" as const,
          status:
            data.nouveauxClientsVariation.tendance === "hausse"
              ? "success"
              : data.nouveauxClientsVariation.tendance === "baisse"
              ? "danger"
              : "neutral",
        },
        {
          label: "Taux de conversion",
          value: data.tauxConversion,
          evolution: data.tauxConversionVariation.pourcentage,
          format: "percentage" as const,
          status:
            data.tauxConversionVariation.tendance === "hausse"
              ? "success"
              : data.tauxConversionVariation.tendance === "baisse"
              ? "danger"
              : "neutral",
        },
        {
          label: "Panier moyen",
          value: data.panierMoyen,
          evolution: data.panierMoyenVariation.pourcentage,
          format: "currency" as const,
          status:
            data.panierMoyenVariation.tendance === "hausse"
              ? "success"
              : data.panierMoyenVariation.tendance === "baisse"
              ? "warning"
              : "neutral",
        },
        {
          label: "CA prévisionnel (3 mois)",
          value: data.caPrevisionnel3Mois,
          format: "currency" as const,
          status: "neutral",
        },
      ]
    : []

  // Transform rankings to legacy CommercialRanking format
  const commercialRankings: CommercialRanking[] = data
    ? data.classementParVentes.map((item) => {
        // Find corresponding CA and conversion data
        const caItem = data.classementParCA.find(
          (c) => c.commercialId === item.commercialId
        )
        const conversionItem = data.classementParConversion.find(
          (c) => c.commercialId === item.commercialId
        )

        return {
          userId: item.commercialId,
          name: item.nomComplet,
          ventes: item.valeur,
          ca: caItem?.valeur || 0,
          tauxConversion: conversionItem?.valeur || 0,
          panierMoyen: caItem && item.valeur > 0 ? caItem.valeur / item.valeur : 0,
        }
      })
    : []

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    kpiCards,
    commercialRankings,
  }
}

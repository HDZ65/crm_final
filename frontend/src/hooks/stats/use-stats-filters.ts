"use client"

import { useState, useCallback, useMemo } from "react"
import type { StatsFilters, PeriodeRapide } from "@/types/stats"

interface UseStatsFiltersOptions {
  defaultPeriode?: PeriodeRapide
  organisationId?: string
}

interface UseStatsFiltersReturn {
  filters: StatsFilters
  setFilters: React.Dispatch<React.SetStateAction<StatsFilters>>
  updateFilter: <K extends keyof StatsFilters>(key: K, value: StatsFilters[K]) => void
  resetFilters: () => void
  queryString: string
  hasActiveFilters: boolean
}

/**
 * Hook for managing dashboard statistics filters
 * Handles period selection, date ranges, and entity filtering
 */
export function useStatsFilters(
  options: UseStatsFiltersOptions = {}
): UseStatsFiltersReturn {
  const { defaultPeriode = "mois_courant", organisationId } = options

  const initialFilters: StatsFilters = {
    periodeRapide: defaultPeriode,
    organisationId,
  }

  const [filters, setFilters] = useState<StatsFilters>(initialFilters)

  const updateFilter = useCallback(
    <K extends keyof StatsFilters>(key: K, value: StatsFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  // Build query string from filters
  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value))
      }
    })

    const result = params.toString()
    return result ? `?${result}` : ""
  }, [filters])

  // Check if any filters are active (beyond defaults)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.societeId !== undefined ||
      filters.produitId !== undefined ||
      filters.canal !== undefined ||
      (filters.periodeRapide === "personnalisee" &&
        (filters.dateDebut !== undefined || filters.dateFin !== undefined))
    )
  }, [filters])

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    queryString,
    hasActiveFilters,
  }
}

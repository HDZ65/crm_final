"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  PalierCommissionResponseDto,
  PalierFiltersDto,
  PalierApplicableFiltersDto,
} from "@/types/commission-dto"

/**
 * Hook pour récupérer la liste des paliers de commission
 * GET /paliers-commission
 */
export function usePaliersCommission(filters?: PalierFiltersDto) {
  const [paliers, setPaliers] = useState<PalierCommissionResponseDto[]>([])
  const { loading, error, execute } = useApi<PalierCommissionResponseDto[]>()

  const fetchPaliers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.baremeId) {
        params.append("baremeId", filters.baremeId)
      }
      if (filters?.actifs !== undefined) {
        params.append("actifs", String(filters.actifs))
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/paliers-commission?${queryString}` : "/paliers-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setPaliers(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.baremeId, filters?.actifs])

  useEffect(() => {
    fetchPaliers()
  }, [fetchPaliers])

  return {
    paliers,
    loading,
    error,
    refetch: fetchPaliers,
  }
}

/**
 * Hook pour récupérer le palier applicable
 * GET /paliers-commission/applicable
 */
export function usePalierApplicable(filters: PalierApplicableFiltersDto | null) {
  const [palier, setPalier] = useState<PalierCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<PalierCommissionResponseDto | null>()

  const fetchPalier = useCallback(async () => {
    if (!filters?.baremeId || !filters?.typePalier || filters?.valeur === undefined) return

    try {
      const params = new URLSearchParams()
      params.append("baremeId", filters.baremeId)
      params.append("typePalier", filters.typePalier)
      params.append("valeur", String(filters.valeur))

      const data = await execute(() => api.get(`/paliers-commission/applicable?${params.toString()}`))
      setPalier(data)
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.baremeId, filters?.typePalier, filters?.valeur])

  useEffect(() => {
    if (filters?.baremeId && filters?.typePalier && filters?.valeur !== undefined) {
      fetchPalier()
    }
  }, [filters?.baremeId, filters?.typePalier, filters?.valeur, fetchPalier])

  return {
    palier,
    loading,
    error,
    refetch: fetchPalier,
  }
}

/**
 * Hook pour récupérer un palier par son ID
 * GET /paliers-commission/:id
 */
export function usePalierCommission(palierId: string | null) {
  const [palier, setPalier] = useState<PalierCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<PalierCommissionResponseDto>()

  const fetchPalier = useCallback(async () => {
    if (!palierId) return

    try {
      const data = await execute(() => api.get(`/paliers-commission/${palierId}`))
      if (data) {
        setPalier(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, palierId])

  useEffect(() => {
    if (palierId) {
      fetchPalier()
    }
  }, [palierId, fetchPalier])

  return {
    palier,
    loading,
    error,
    refetch: fetchPalier,
  }
}

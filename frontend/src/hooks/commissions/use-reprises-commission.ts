"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { RepriseWithDetails, RepriseFilters } from "@/lib/ui/display-types/commission"

/**
 * Hook pour récupérer la liste des reprises de commission
 * GET /reprises-commission
 */
export function useReprisesCommission(filters?: RepriseFilters) {
  const [reprises, setReprises] = useState<RepriseWithDetails[]>([])
  const { loading, error, execute } = useApi<RepriseWithDetails[]>()

  const fetchReprises = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.apporteurId) {
        params.append("apporteurId", filters.apporteurId)
      }
      if (filters?.contratId) {
        params.append("contratId", filters.contratId)
      }
      if (filters?.periode) {
        params.append("periode", filters.periode)
      }
      if (filters?.enAttente !== undefined) {
        params.append("enAttente", String(filters.enAttente))
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/reprises-commission?${queryString}` : "/reprises-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setReprises(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [
    execute,
    filters?.organisationId,
    filters?.apporteurId,
    filters?.contratId,
    filters?.periode,
    filters?.enAttente,
  ])

  useEffect(() => {
    fetchReprises()
  }, [fetchReprises])

  return {
    reprises,
    loading,
    error,
    refetch: fetchReprises,
  }
}

/**
 * Hook pour récupérer une reprise par son ID
 * GET /reprises-commission/:id
 */
export function useRepriseCommission(repriseId: string | null) {
  const [reprise, setReprise] = useState<RepriseWithDetails | null>(null)
  const { loading, error, execute } = useApi<RepriseWithDetails>()

  const fetchReprise = useCallback(async () => {
    if (!repriseId) return

    try {
      const data = await execute(() => api.get(`/reprises-commission/${repriseId}`))
      if (data) {
        setReprise(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, repriseId])

  useEffect(() => {
    if (repriseId) {
      fetchReprise()
    }
  }, [repriseId, fetchReprise])

  return {
    reprise,
    loading,
    error,
    refetch: fetchReprise,
  }
}

/**
 * Hook pour récupérer les reprises en attente
 */
export function useReprisesEnAttente(organisationId?: string, apporteurId?: string) {
  return useReprisesCommission({
    organisationId,
    apporteurId,
    enAttente: true,
  })
}

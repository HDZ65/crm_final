"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  BordereauWithDetails,
  BordereauFilters,
} from "@/lib/ui/display-types/commission"

/**
 * Hook pour récupérer la liste des bordereaux de commission
 * GET /bordereaux-commission
 */
export function useBordereauxCommission(filters?: BordereauFilters) {
  const [bordereaux, setBordereaux] = useState<BordereauWithDetails[]>([])
  const { loading, error, execute } = useApi<BordereauWithDetails[]>()

  const fetchBordereaux = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.apporteurId) {
        params.append("apporteurId", filters.apporteurId)
      }
      if (filters?.periode) {
        params.append("periode", filters.periode)
      }
      if (filters?.statut) {
        params.append("statut", filters.statut)
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/bordereaux-commission?${queryString}`
        : "/bordereaux-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setBordereaux(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.apporteurId, filters?.periode, filters?.statut])

  useEffect(() => {
    fetchBordereaux()
  }, [fetchBordereaux])

  return {
    bordereaux,
    loading,
    error,
    refetch: fetchBordereaux,
  }
}

/**
 * Hook pour récupérer les bordereaux avec leurs détails
 * GET /bordereaux-commission/with-details
 */
export function useBordereauxWithDetails(organisationId?: string) {
  const [bordereaux, setBordereaux] = useState<BordereauWithDetails[]>([])
  const { loading, error, execute } = useApi<BordereauWithDetails[]>()

  const fetchBordereaux = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (organisationId) {
        params.append("organisationId", organisationId)
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/bordereaux-commission/with-details?${queryString}`
        : "/bordereaux-commission/with-details"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setBordereaux(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, organisationId])

  useEffect(() => {
    fetchBordereaux()
  }, [fetchBordereaux])

  return {
    bordereaux,
    loading,
    error,
    refetch: fetchBordereaux,
  }
}

/**
 * Hook pour récupérer un bordereau par son ID
 * GET /bordereaux-commission/:id
 */
export function useBordereauCommission(bordereauId: string | null) {
  const [bordereau, setBordereau] = useState<BordereauWithDetails | null>(null)
  const { loading, error, execute } = useApi<BordereauWithDetails>()

  const fetchBordereau = useCallback(async () => {
    if (!bordereauId) return

    try {
      const data = await execute(() => api.get(`/bordereaux-commission/${bordereauId}`))
      if (data) {
        setBordereau(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, bordereauId])

  useEffect(() => {
    if (bordereauId) {
      fetchBordereau()
    }
  }, [bordereauId, fetchBordereau])

  return {
    bordereau,
    loading,
    error,
    refetch: fetchBordereau,
  }
}

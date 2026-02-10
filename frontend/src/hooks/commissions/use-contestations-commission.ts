"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { ContestationWithDetails } from "@/lib/ui/display-types/commission"

// ============================================================================
// Filters
// ============================================================================

export interface ContestationFilters {
  organisationId?: string
  commissionId?: string
  bordereauId?: string
  apporteurId?: string
  statut?: string
}

// ============================================================================
// READ hooks
// ============================================================================

/**
 * Hook pour r{\'e}cup{\'e}rer les contestations avec filtres
 * GET /contestations-commission
 */
export function useContestations(filters?: ContestationFilters) {
  const [contestations, setContestations] = useState<ContestationWithDetails[]>([])
  const { loading, error, execute } = useApi<ContestationWithDetails[]>()

  const fetchContestations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.commissionId) {
        params.append("commissionId", filters.commissionId)
      }
      if (filters?.bordereauId) {
        params.append("bordereauId", filters.bordereauId)
      }
      if (filters?.apporteurId) {
        params.append("apporteurId", filters.apporteurId)
      }
      if (filters?.statut) {
        params.append("statut", filters.statut)
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/contestations-commission?${queryString}`
        : "/contestations-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setContestations(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [
    execute,
    filters?.organisationId,
    filters?.commissionId,
    filters?.bordereauId,
    filters?.apporteurId,
    filters?.statut,
  ])

  useEffect(() => {
    fetchContestations()
  }, [fetchContestations])

  return {
    contestations,
    loading,
    error,
    refetch: fetchContestations,
  }
}

// ============================================================================
// MUTATION hooks
// ============================================================================

export interface CreerContestationPayload {
  organisationId: string
  commissionId: string
  bordereauId: string
  apporteurId: string
  motif: string
}

/**
 * Hook pour cr{\'e}er une contestation
 * POST /contestations-commission
 */
export function useCreerContestation() {
  const [contestation, setContestation] = useState<ContestationWithDetails | null>(null)
  const { loading, error, execute } = useApi<ContestationWithDetails>()

  const creer = useCallback(
    async (payload: CreerContestationPayload) => {
      try {
        const response = await execute(() =>
          api.post("/contestations-commission", payload)
        )
        if (response) {
          setContestation(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setContestation(null)
  }, [])

  return {
    contestation,
    loading,
    error,
    creer,
    reset,
  }
}

export interface ResoudreContestationPayload {
  id: string
  acceptee: boolean
  commentaire: string
  resoluPar: string
}

/**
 * Hook pour r{\'e}soudre une contestation
 * POST /contestations-commission/:id/resoudre
 */
export function useResoudreContestation() {
  const [contestation, setContestation] = useState<ContestationWithDetails | null>(null)
  const { loading, error, execute } = useApi<ContestationWithDetails>()

  const resoudre = useCallback(
    async (payload: ResoudreContestationPayload) => {
      try {
        const response = await execute(() =>
          api.post(`/contestations-commission/${payload.id}/resoudre`, {
            acceptee: payload.acceptee,
            commentaire: payload.commentaire,
            resoluPar: payload.resoluPar,
          })
        )
        if (response) {
          setContestation(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setContestation(null)
  }, [])

  return {
    contestation,
    loading,
    error,
    resoudre,
    reset,
  }
}

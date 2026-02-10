"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

// ============================================================================
// Types
// ============================================================================

export interface RecurrenceDisplay {
  id: string
  organisationId: string
  commissionOriginaleId: string
  contratId: string
  apporteurId: string
  baremeId: string
  montantRecurrence: string
  tauxRecurrence: string
  periodeApplication: string
  numeroEcheance: number
  totalEcheances: number
  statut: number
  dateCreation: Date | string
  dateApplication: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RecurrenceFilters {
  organisationId?: string
  apporteurId?: string
  periode?: string
  statut?: number
  limit?: number
  offset?: number
}

interface RecurrenceListResult {
  recurrences: RecurrenceDisplay[]
  total: number
}

// ============================================================================
// READ hooks
// ============================================================================

/**
 * Hook pour recuperer les recurrences de commission avec filtres
 * GET /recurrences-commission
 */
export function useRecurrences(filters?: RecurrenceFilters) {
  const [recurrences, setRecurrences] = useState<RecurrenceDisplay[]>([])
  const [total, setTotal] = useState(0)
  const { loading, error, execute } = useApi<RecurrenceListResult>()

  const fetchRecurrences = useCallback(async () => {
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
      if (filters?.statut !== undefined) {
        params.append("statut", String(filters.statut))
      }
      if (filters?.limit !== undefined) {
        params.append("limit", String(filters.limit))
      }
      if (filters?.offset !== undefined) {
        params.append("offset", String(filters.offset))
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/recurrences-commission?${queryString}`
        : "/recurrences-commission"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setRecurrences(data.recurrences ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      // Error handled by useApi
    }
  }, [
    execute,
    filters?.organisationId,
    filters?.apporteurId,
    filters?.periode,
    filters?.statut,
    filters?.limit,
    filters?.offset,
  ])

  useEffect(() => {
    fetchRecurrences()
  }, [fetchRecurrences])

  return {
    recurrences,
    total,
    loading,
    error,
    refetch: fetchRecurrences,
  }
}

/**
 * Hook pour recuperer les recurrences d'un contrat specifique
 * GET /recurrences-commission/by-contrat/:contratId
 */
export function useRecurrencesByContrat(contratId: string | null, organisationId?: string) {
  const [recurrences, setRecurrences] = useState<RecurrenceDisplay[]>([])
  const { loading, error, execute } = useApi<RecurrenceListResult>()

  const fetchRecurrences = useCallback(async () => {
    if (!contratId) return

    try {
      const params = new URLSearchParams()
      if (organisationId) {
        params.append("organisationId", organisationId)
      }

      const queryString = params.toString()
      const endpoint = queryString
        ? `/recurrences-commission/by-contrat/${contratId}?${queryString}`
        : `/recurrences-commission/by-contrat/${contratId}`

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setRecurrences(data.recurrences ?? [])
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, contratId, organisationId])

  useEffect(() => {
    if (contratId) {
      fetchRecurrences()
    }
  }, [contratId, fetchRecurrences])

  return {
    recurrences,
    loading,
    error,
    refetch: fetchRecurrences,
  }
}

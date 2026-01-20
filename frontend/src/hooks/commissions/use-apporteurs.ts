"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { ApporteurResponseDto, ApporteurFilters } from "@/types/commission"

/**
 * Hook pour récupérer la liste des apporteurs
 * GET /apporteurs
 */
export function useApporteurs(filters?: ApporteurFilters) {
  const [apporteurs, setApporteurs] = useState<ApporteurResponseDto[]>([])
  const { loading, error, execute } = useApi<ApporteurResponseDto[]>()

  const fetchApporteurs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/apporteurs?${queryString}` : "/apporteurs"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setApporteurs(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId])

  useEffect(() => {
    fetchApporteurs()
  }, [fetchApporteurs])

  return {
    apporteurs,
    loading,
    error,
    refetch: fetchApporteurs,
  }
}

/**
 * Hook pour récupérer un apporteur par son ID
 * GET /apporteurs/:id
 */
export function useApporteur(apporteurId: string | null) {
  const [apporteur, setApporteur] = useState<ApporteurResponseDto | null>(null)
  const { loading, error, execute } = useApi<ApporteurResponseDto>()

  const fetchApporteur = useCallback(async () => {
    if (!apporteurId) return

    try {
      const data = await execute(() => api.get(`/apporteurs/${apporteurId}`))
      if (data) {
        setApporteur(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, apporteurId])

  useEffect(() => {
    if (apporteurId) {
      fetchApporteur()
    }
  }, [apporteurId, fetchApporteur])

  return {
    apporteur,
    loading,
    error,
    refetch: fetchApporteur,
  }
}

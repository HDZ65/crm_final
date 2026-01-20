"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { StatutCommissionResponseDto } from "@/types/commission"

/**
 * Hook pour récupérer la liste des statuts de commission
 * GET /statuts-commission
 */
export function useStatutsCommission() {
  const [statuts, setStatuts] = useState<StatutCommissionResponseDto[]>([])
  const { loading, error, execute } = useApi<StatutCommissionResponseDto[]>()

  const fetchStatuts = useCallback(async () => {
    try {
      const data = await execute(() => api.get("/statuts-commission"))
      if (data) {
        setStatuts(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute])

  useEffect(() => {
    fetchStatuts()
  }, [fetchStatuts])

  return {
    statuts,
    loading,
    error,
    refetch: fetchStatuts,
  }
}

/**
 * Hook pour récupérer un statut de commission par son ID
 * GET /statuts-commission/:id
 */
export function useStatutCommission(statutId: string | null) {
  const [statut, setStatut] = useState<StatutCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<StatutCommissionResponseDto>()

  const fetchStatut = useCallback(async () => {
    if (!statutId) return

    try {
      const data = await execute(() => api.get(`/statuts-commission/${statutId}`))
      if (data) {
        setStatut(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, statutId])

  useEffect(() => {
    if (statutId) {
      fetchStatut()
    }
  }, [statutId, fetchStatut])

  return {
    statut,
    loading,
    error,
    refetch: fetchStatut,
  }
}

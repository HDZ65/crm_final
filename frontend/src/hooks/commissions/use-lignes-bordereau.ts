"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { LigneBordereauResponseDto, LigneBordereauFiltersDto } from "@/types/commission-dto"

/**
 * Hook pour récupérer les lignes d'un bordereau
 * GET /lignes-bordereau
 */
export function useLignesBordereau(filters: LigneBordereauFiltersDto | null) {
  const [lignes, setLignes] = useState<LigneBordereauResponseDto[]>([])
  const { loading, error, execute } = useApi<LigneBordereauResponseDto[]>()

  const fetchLignes = useCallback(async () => {
    if (!filters?.bordereauId) return

    try {
      const params = new URLSearchParams()
      params.append("bordereauId", filters.bordereauId)
      if (filters.selectionnees !== undefined) {
        params.append("selectionnees", String(filters.selectionnees))
      }

      const data = await execute(() => api.get(`/lignes-bordereau?${params.toString()}`))
      if (data) {
        setLignes(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.bordereauId, filters?.selectionnees])

  useEffect(() => {
    if (filters?.bordereauId) {
      fetchLignes()
    }
  }, [filters?.bordereauId, fetchLignes])

  // Calcul des totaux des lignes
  const totals = useMemo(() => {
    return lignes.reduce(
      (acc, ligne) => ({
        totalBrut: acc.totalBrut + ligne.montantBrut,
        totalReprise: acc.totalReprise + ligne.montantReprise,
        totalNet: acc.totalNet + ligne.montantNet,
        nombreLignes: acc.nombreLignes + 1,
        nombreSelectionnees: acc.nombreSelectionnees + (ligne.selectionne ? 1 : 0),
      }),
      {
        totalBrut: 0,
        totalReprise: 0,
        totalNet: 0,
        nombreLignes: 0,
        nombreSelectionnees: 0,
      }
    )
  }, [lignes])

  return {
    lignes,
    totals,
    loading,
    error,
    refetch: fetchLignes,
  }
}

/**
 * Hook pour récupérer une ligne de bordereau par son ID
 * GET /lignes-bordereau/:id
 */
export function useLigneBordereau(ligneId: string | null) {
  const [ligne, setLigne] = useState<LigneBordereauResponseDto | null>(null)
  const { loading, error, execute } = useApi<LigneBordereauResponseDto>()

  const fetchLigne = useCallback(async () => {
    if (!ligneId) return

    try {
      const data = await execute(() => api.get(`/lignes-bordereau/${ligneId}`))
      if (data) {
        setLigne(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, ligneId])

  useEffect(() => {
    if (ligneId) {
      fetchLigne()
    }
  }, [ligneId, fetchLigne])

  return {
    ligne,
    loading,
    error,
    refetch: fetchLigne,
  }
}

/**
 * Hook pour récupérer uniquement les lignes sélectionnées d'un bordereau
 */
export function useLignesSelectionnees(bordereauId: string | null) {
  return useLignesBordereau(
    bordereauId
      ? {
          bordereauId,
          selectionnees: true,
        }
      : null
  )
}

"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { LigneBordereauDisplay, LigneBordereauFilters } from "@/lib/ui/display-types/commission"
import { parseMontant } from "@/lib/ui/helpers/format"

/**
 * Hook pour récupérer les lignes d'un bordereau
 * GET /lignes-bordereau
 */
export function useLignesBordereau(filters: LigneBordereauFilters | null) {
  const [lignes, setLignes] = useState<LigneBordereauDisplay[]>([])
  const { loading, error, execute } = useApi<LigneBordereauDisplay[]>()

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
        totalBrut: acc.totalBrut + parseMontant(ligne.montantBrut),
        totalReprise: acc.totalReprise + parseMontant(ligne.montantReprise),
        totalNet: acc.totalNet + parseMontant(ligne.montantNet),
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
  const [ligne, setLigne] = useState<LigneBordereauDisplay | null>(null)
  const { loading, error, execute } = useApi<LigneBordereauDisplay>()

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

// ============================================================================
// MUTATION hooks
// ============================================================================

interface PreselectionResult {
  nombreLignesSelectionnees: number
  nombreLignesTotal: number
  ligneIdsSelectionnees: string[]
}

/**
 * Hook pour présélectionner les lignes d'un bordereau
 * POST /lignes-bordereau/preselectionner
 */
export function usePreselectionnerLignes() {
  const [result, setResult] = useState<PreselectionResult | null>(null)
  const { loading, error, execute } = useApi<PreselectionResult>()

  const preselectionner = useCallback(
    async (bordereauId: string, organisationId: string) => {
      try {
        const response = await execute(() =>
          api.post("/lignes-bordereau/preselectionner", {
            bordereauId,
            organisationId,
          })
        )
        if (response) {
          setResult(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return {
    result,
    loading,
    error,
    preselectionner,
    reset,
  }
}

interface TotauxResult {
  totalBrut: string
  totalReprises: string
  totalAcomptes: string
  totalNet: string
  nombreLignesSelectionnees: number
}

/**
 * Hook pour recalculer les totaux d'un bordereau
 * POST /lignes-bordereau/recalculer-totaux
 */
export function useRecalculerTotaux() {
  const [totaux, setTotaux] = useState<TotauxResult | null>(null)
  const { loading, error, execute } = useApi<TotauxResult>()

  const recalculer = useCallback(
    async (bordereauId: string, ligneIds: string[]) => {
      try {
        const response = await execute(() =>
          api.post("/lignes-bordereau/recalculer-totaux", {
            bordereauId,
            ligneIdsSelectionnees: ligneIds,
          })
        )
        if (response) {
          setTotaux(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setTotaux(null)
  }, [])

  return {
    totaux,
    loading,
    error,
    recalculer,
    reset,
  }
}

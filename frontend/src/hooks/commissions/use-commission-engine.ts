"use client"

import { useCallback, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  CalculerCommissionResponse,
  GenererBordereauResponse,
  RepriseWithDetails,
} from "@/lib/ui/display-types/commission"
import type {
  CalculerCommissionRequest,
  GenererBordereauRequest,
} from "@proto/commission/commission"
import type { TypeReprise } from "@/lib/ui/display-types/commission"

interface DeclencherReprisePayload {
  organisationId: string
  commissionId: string
  typeReprise: TypeReprise
  motif?: string
  commentaire?: string
}

/**
 * Hook pour calculer une commission via le moteur
 * POST /commission-engine/calculer
 */
export function useCalculerCommission() {
  const [result, setResult] = useState<CalculerCommissionResponse | null>(null)
  const { loading, error, execute } = useApi<CalculerCommissionResponse>()

  const calculer = useCallback(
    async (data: CalculerCommissionRequest) => {
      try {
        const response = await execute(() => api.post("/commission-engine/calculer", data))
        if (response) {
          setResult(response)
        }
        return response
      } catch {
        // Error handled by useApi
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
    calculer,
    reset,
  }
}

/**
 * Hook pour générer un bordereau via le moteur
 * POST /commission-engine/generer-bordereau
 */
export function useGenererBordereau() {
  const [result, setResult] = useState<GenererBordereauResponse | null>(null)
  const { loading, error, execute } = useApi<GenererBordereauResponse>()

  const generer = useCallback(
    async (data: GenererBordereauRequest) => {
      try {
        const response = await execute(() => api.post("/commission-engine/generer-bordereau", data))
        if (response) {
          setResult(response)
        }
        return response
      } catch {
        // Error handled by useApi
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
    generer,
    reset,
  }
}

/**
 * Hook pour déclencher une reprise via le moteur
 * POST /commission-engine/declencher-reprise
 */
export function useDeclencherReprise() {
  const [reprise, setReprise] = useState<RepriseWithDetails | null>(null)
  const { loading, error, execute } = useApi<RepriseWithDetails | null>()

  const declencher = useCallback(
    async (data: DeclencherReprisePayload) => {
      try {
        const response = await execute(() => api.post("/commission-engine/declencher-reprise", data))
        setReprise(response)
        return response
      } catch {
        // Error handled by useApi
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setReprise(null)
  }, [])

  return {
    reprise,
    loading,
    error,
    declencher,
    reset,
  }
}

/**
 * Hook combiné pour toutes les opérations du moteur de commission
 */
export function useCommissionEngine() {
  const calculer = useCalculerCommission()
  const genererBordereau = useGenererBordereau()
  const declencherReprise = useDeclencherReprise()

  return {
    calculer,
    genererBordereau,
    declencherReprise,
  }
}

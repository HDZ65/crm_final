"use client"

import { useState, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'

export type OrchestrationAction = 'activate' | 'suspend' | 'terminate' | 'port-in'

export interface OrchestrationPayload {
  payload?: Record<string, unknown>
  reason?: string
  effectiveDate?: string
}

export interface UseContractOrchestrationResult {
  loading: boolean
  error: ApiError | null
  lastAction: OrchestrationAction | null
  activate: (payload?: OrchestrationPayload) => Promise<boolean>
  suspend: (payload?: OrchestrationPayload) => Promise<boolean>
  terminate: (payload?: OrchestrationPayload) => Promise<boolean>
  portIn: (payload?: OrchestrationPayload) => Promise<boolean>
  reset: () => void
}

/**
 * Hook pour gérer les actions d'orchestration des contrats
 * Permet d'activer, suspendre, résilier ou porter un contrat
 *
 * @param contractId - L'ID du contrat à orchestrer
 * @returns Les méthodes d'orchestration et l'état de chargement/erreur
 *
 * @example
 * ```tsx
 * const { activate, suspend, terminate, loading, error } = useContractOrchestration(contractId)
 *
 * const handleActivate = async () => {
 *   const success = await activate({ reason: 'Activation standard' })
 *   if (success) {
 *     toast.success('Contrat activé')
 *   }
 * }
 * ```
 */
export function useContractOrchestration(contractId: string): UseContractOrchestrationResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [lastAction, setLastAction] = useState<OrchestrationAction | null>(null)

  const executeAction = useCallback(async (
    action: OrchestrationAction,
    payload?: OrchestrationPayload
  ): Promise<boolean> => {
    if (!contractId) {
      setError(new ApiError('ID de contrat manquant', 400))
      return false
    }

    setLoading(true)
    setError(null)
    setLastAction(action)

    try {
      await api.post(`/orchestration/contracts/${contractId}/${action}`, payload || {})
      return true
    } catch (err) {
      const apiError = err instanceof ApiError
        ? err
        : new ApiError('Erreur lors de l\'opération', 500)
      setError(apiError)
      return false
    } finally {
      setLoading(false)
    }
  }, [contractId])

  const activate = useCallback(
    (payload?: OrchestrationPayload) => executeAction('activate', payload),
    [executeAction]
  )

  const suspend = useCallback(
    (payload?: OrchestrationPayload) => executeAction('suspend', payload),
    [executeAction]
  )

  const terminate = useCallback(
    (payload?: OrchestrationPayload) => executeAction('terminate', payload),
    [executeAction]
  )

  const portIn = useCallback(
    (payload?: OrchestrationPayload) => executeAction('port-in', payload),
    [executeAction]
  )

  const reset = useCallback(() => {
    setError(null)
    setLastAction(null)
  }, [])

  return {
    loading,
    error,
    lastAction,
    activate,
    suspend,
    terminate,
    portIn,
    reset,
  }
}

/**
 * Labels français pour les actions d'orchestration
 */
export const ORCHESTRATION_ACTION_LABELS: Record<OrchestrationAction, string> = {
  'activate': 'Activer',
  'suspend': 'Suspendre',
  'terminate': 'Résilier',
  'port-in': 'Portabilité entrante',
}

/**
 * Descriptions des actions d'orchestration
 */
export const ORCHESTRATION_ACTION_DESCRIPTIONS: Record<OrchestrationAction, string> = {
  'activate': 'Active le contrat et démarre la facturation',
  'suspend': 'Suspend temporairement le contrat sans résiliation',
  'terminate': 'Résilie définitivement le contrat',
  'port-in': 'Enregistre une portabilité entrante sur ce contrat',
}

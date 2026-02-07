"use client"

import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/auth/useAuth'
import {
  activateContrat,
  suspendContrat,
  terminateContrat,
  portInContrat,
} from '@/actions/contrats'

export type OrchestrationAction = 'activate' | 'suspend' | 'terminate' | 'port-in'

/**
 * Rôles autorisés pour les opérations d'orchestration
 * Doit être synchronisé avec @Roles backend: contract-orchestration.controller.ts
 */
export const ORCHESTRATION_ALLOWED_ROLES = ['realm:commercial', 'realm:manager', 'realm:admin'] as const

export interface OrchestrationPayload {
  payload?: Record<string, unknown>
  reason?: string
  effectiveDate?: string
}

export interface UseContractOrchestrationResult {
  error: string | null
  lastAction: OrchestrationAction | null
  canOrchestrate: boolean // Whether user has required roles
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
  const { hasAnyRole } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<OrchestrationAction | null>(null)

  // Check if user has required roles for orchestration operations
  const canOrchestrate = useMemo(
    () => hasAnyRole([...ORCHESTRATION_ALLOWED_ROLES]),
    [hasAnyRole]
  )

  const executeAction = useCallback(async (
    action: OrchestrationAction,
    payload?: OrchestrationPayload
  ): Promise<boolean> => {
    if (!contractId) {
      setError('ID de contrat manquant')
      return false
    }

    // Check role before making API call to avoid 403
    if (!canOrchestrate) {
      setError('Vous n\'avez pas les droits pour effectuer cette action')
      return false
    }

    setError(null)
    setLastAction(action)

    try {
      let result: { data: { success: boolean; message: string } | null; error: string | null }
      const payloadData = payload?.payload || {}

      switch (action) {
        case 'activate':
          result = await activateContrat(contractId, payloadData)
          break
        case 'suspend':
          result = await suspendContrat(contractId, payloadData)
          break
        case 'terminate':
          result = await terminateContrat(contractId, payloadData)
          break
        case 'port-in':
          result = await portInContrat(contractId, payloadData)
          break
        default:
          setError('Action inconnue')
          return false
      }

      if (result.error) {
        setError(result.error)
        return false
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'opération'
      setError(errorMessage)
      return false
    }
  }, [contractId, canOrchestrate])

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
    error,
    lastAction,
    canOrchestrate,
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

"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type {
  ExpeditionDto,
  ExpeditionEtat,
  ExpeditionsFilters,
} from "@/types/expedition"

// Re-export des types pour compatibilité avec les imports existants
export type {
  ExpeditionEtat,
  ExpeditionClient,
  ExpeditionContrat,
  ExpeditionTransporteur,
  ExpeditionDto,
  ExpeditionsFilters,
} from "@/types/expedition"

export {
  EXPEDITION_ETAT_LABELS,
  EXPEDITION_ETAT_VARIANTS,
} from "@/types/expedition"

/**
 * Hook pour récupérer la liste des expéditions avec détails
 *
 * Note: Les filtres etat, clientId, contratId, transporteurId, dateDebut, dateFin
 * sont envoyés mais nécessitent une mise à jour du backend pour être pris en compte.
 * Actuellement seul organisationId est supporté côté backend.
 */
export function useExpeditions(organisationId: string | null, filters?: ExpeditionsFilters) {
  const [expeditions, setExpeditions] = useState<ExpeditionDto[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchExpeditions = useCallback(async () => {
    if (!organisationId) return

    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("organisationId", organisationId)

      if (filters?.etat) params.append("etat", filters.etat)
      if (filters?.clientId) params.append("clientId", filters.clientId)
      if (filters?.contratId) params.append("contratId", filters.contratId)
      if (filters?.transporteurId) params.append("transporteurId", filters.transporteurId)
      if (filters?.dateDebut) params.append("dateDebut", filters.dateDebut)
      if (filters?.dateFin) params.append("dateFin", filters.dateFin)

      const data: ExpeditionDto[] = await api.get(`/expeditions/with-details?${params.toString()}`)
      setExpeditions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des expéditions"))
    }
  }, [organisationId, filters?.etat, filters?.clientId, filters?.contratId, filters?.transporteurId, filters?.dateDebut, filters?.dateFin])

  useEffect(() => {
    if (organisationId) {
      fetchExpeditions()
    }
  }, [organisationId, fetchExpeditions])

  return {
    expeditions,
    error,
    refetch: fetchExpeditions,
  }
}

/**
 * Hook pour récupérer une expédition par son ID
 */
export function useExpedition(expeditionId: string | null) {
  const [expedition, setExpedition] = useState<ExpeditionDto | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchExpedition = useCallback(async () => {
    if (!expeditionId) return

    setError(null)

    try {
      const data: ExpeditionDto = await api.get(`/expeditions/${expeditionId}`)
      setExpedition(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement de l'expédition"))
    }
  }, [expeditionId])

  useEffect(() => {
    if (expeditionId) {
      fetchExpedition()
    }
  }, [expeditionId, fetchExpedition])

  return {
    expedition,
    error,
    refetch: fetchExpedition,
  }
}

/**
 * Hook pour récupérer les expéditions d'un client spécifique
 */
export function useClientExpeditions(organisationId: string | null, clientId: string | null) {
  return useExpeditions(organisationId, clientId ? { clientId } : undefined)
}

/**
 * Hook pour récupérer les expéditions d'un contrat spécifique
 */
export function useContratExpeditions(organisationId: string | null, contratId: string | null) {
  return useExpeditions(organisationId, contratId ? { contratId } : undefined)
}

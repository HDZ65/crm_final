"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

export interface Contrat {
  id: string
  organisationId: string
  clientBaseId: string
  reference: string
  dateDebut: string
  dateFin?: string
  montantHT?: number
  montantTTC?: number
  statutId?: string
  statut?: {
    id: string
    libelle: string
  }
  clientBase?: {
    id: string
    nom?: string
    prenom?: string
    raisonSociale?: string
  }
  createdAt: string
  updatedAt: string
}

interface ContratsFilters {
  organisationId?: string
  clientBaseId?: string
  statutId?: string
}

/**
 * Hook pour récupérer la liste des contrats
 * GET /contrats
 */
export function useContrats(filters?: ContratsFilters) {
  const [contrats, setContrats] = useState<Contrat[]>([])
  const { loading, error, execute } = useApi<Contrat[]>()

  const fetchContrats = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.clientBaseId) {
        params.append("clientBaseId", filters.clientBaseId)
      }
      if (filters?.statutId) {
        params.append("statutId", filters.statutId)
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/contrats?${queryString}` : "/contrats"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setContrats(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.clientBaseId, filters?.statutId])

  useEffect(() => {
    fetchContrats()
  }, [fetchContrats])

  return {
    contrats,
    loading,
    error,
    refetch: fetchContrats,
  }
}

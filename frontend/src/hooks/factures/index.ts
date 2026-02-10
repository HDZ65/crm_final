"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { Facture, StatutFacture } from "@proto/factures/factures"
import type { FactureFilters } from "@/lib/ui/labels/facture"

/**
 * Hook pour récupérer la liste des factures
 * GET /factures
 */
export function useFactures(filters?: FactureFilters) {
  const [factures, setFactures] = useState<Facture[]>([])
  const { loading, error, execute } = useApi<Facture[]>()

  const fetchFactures = useCallback(async () => {
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
      if (filters?.dateDebut) {
        params.append("dateDebut", filters.dateDebut)
      }
      if (filters?.dateFin) {
        params.append("dateFin", filters.dateFin)
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/factures?${queryString}` : "/factures"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setFactures(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.clientBaseId, filters?.statutId, filters?.dateDebut, filters?.dateFin])

  useEffect(() => {
    fetchFactures()
  }, [fetchFactures])

  return {
    factures,
    loading,
    error,
    refetch: fetchFactures,
  }
}

/**
 * Hook pour récupérer une facture par son ID
 * GET /factures/:id
 */
export function useFacture(factureId: string | null) {
  const [facture, setFacture] = useState<Facture | null>(null)
  const { loading, error, execute } = useApi<Facture>()

  const fetchFacture = useCallback(async () => {
    if (!factureId) return

    try {
      const data = await execute(() => api.get(`/factures/${factureId}`))
      if (data) {
        setFacture(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, factureId])

  useEffect(() => {
    if (factureId) {
      fetchFacture()
    }
  }, [factureId, fetchFacture])

  return {
    facture,
    loading,
    error,
    refetch: fetchFacture,
  }
}

/**
 * Hook pour récupérer les statuts de factures
 * GET /statut-factures
 */
export function useStatutFactures() {
  const [statuts, setStatuts] = useState<StatutFacture[]>([])
  const { loading, error, execute } = useApi<StatutFacture[]>()

  const fetchStatuts = useCallback(async () => {
    try {
      const data = await execute(() => api.get("/statut-factures"))
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
 * Hook pour créer une facture
 * POST /factures
 */
export function useCreateFacture() {
  const [facture, setFacture] = useState<Facture | null>(null)
  const { loading, error, execute } = useApi<Facture>()

  const create = useCallback(
    async (data: Partial<Facture>) => {
      try {
        const response = await execute(() => api.post("/factures", data))
        if (response) {
          setFacture(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setFacture(null)
  }, [])

  return {
    facture,
    loading,
    error,
    create,
    reset,
  }
}

/**
 * Hook pour mettre à jour une facture
 * PATCH /factures/:id
 */
export function useUpdateFacture() {
  const [facture, setFacture] = useState<Facture | null>(null)
  const { loading, error, execute } = useApi<Facture>()

  const update = useCallback(
    async (factureId: string, data: Partial<Facture>) => {
      try {
        const response = await execute(() => api.patch(`/factures/${factureId}`, data))
        if (response) {
          setFacture(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setFacture(null)
  }, [])

  return {
    facture,
    loading,
    error,
    update,
    reset,
  }
}

/**
 * Hook pour supprimer une facture
 * DELETE /factures/:id
 */
export function useDeleteFacture() {
  const { loading, error, execute } = useApi<void>()

  const deleteFacture = useCallback(
    async (factureId: string) => {
      try {
        await execute(() => api.delete(`/factures/${factureId}`))
        return true
      } catch {
        return false
      }
    },
    [execute]
  )

  return {
    loading,
    error,
    deleteFacture,
  }
}

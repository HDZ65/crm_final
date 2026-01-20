"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type {
  RegleRelanceDto,
  CreateRegleRelanceDto,
  UpdateRegleRelanceDto,
  HistoriqueRelanceDto,
} from "@/types/regle-relance"

interface RegleRelanceFilters {
  organisationId?: string
  actif?: boolean
  declencheur?: string
}

export function useReglesRelance(filters?: RegleRelanceFilters) {
  const [regles, setRegles] = useState<RegleRelanceDto[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchRegles = useCallback(async () => {
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) params.append("organisationId", filters.organisationId)
      if (filters?.actif !== undefined) params.append("actif", String(filters.actif))
      if (filters?.declencheur) params.append("declencheur", filters.declencheur)

      const queryString = params.toString()
      const endpoint = queryString ? `/regles-relance?${queryString}` : "/regles-relance"

      const data = await api.get<RegleRelanceDto[]>(endpoint)
      setRegles(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des règles"))
    }
  }, [filters])

  useEffect(() => {
    fetchRegles()
  }, [fetchRegles])

  return {
    regles,
    error,
    refetch: fetchRegles,
  }
}

export function useRegleRelanceMutations() {
  const [error, setError] = useState<Error | null>(null)

  const createRegle = useCallback(async (data: CreateRegleRelanceDto): Promise<RegleRelanceDto | null> => {
    setError(null)

    try {
      const result = await api.post<RegleRelanceDto>("/regles-relance", data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la création"))
      return null
    }
  }, [])

  const updateRegle = useCallback(async (id: string, data: UpdateRegleRelanceDto): Promise<RegleRelanceDto | null> => {
    setError(null)

    try {
      const result = await api.put<RegleRelanceDto>(`/regles-relance/${id}`, data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la mise à jour"))
      return null
    }
  }, [])

  const deleteRegle = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      await api.delete(`/regles-relance/${id}`)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la suppression"))
      return false
    }
  }, [])

  const activerRegle = useCallback(async (id: string): Promise<RegleRelanceDto | null> => {
    setError(null)

    try {
      const result = await api.put<RegleRelanceDto>(`/regles-relance/${id}/activer`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'activation"))
      return null
    }
  }, [])

  const desactiverRegle = useCallback(async (id: string): Promise<RegleRelanceDto | null> => {
    setError(null)

    try {
      const result = await api.put<RegleRelanceDto>(`/regles-relance/${id}/desactiver`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la désactivation"))
      return null
    }
  }, [])

  const executerRelances = useCallback(async (organisationId: string): Promise<{ success: boolean; message: string }> => {
    setError(null)

    try {
      const result = await api.post<{ success: boolean; message: string }>("/regles-relance/executer", { organisationId })
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'exécution"))
      return { success: false, message: "Erreur lors de l'exécution des relances" }
    }
  }, [])

  return {
    error,
    createRegle,
    updateRegle,
    deleteRegle,
    activerRegle,
    desactiverRegle,
    executerRelances,
  }
}

export function useHistoriqueRelances(filters?: { organisationId?: string; limit?: number }) {
  const [historique, setHistorique] = useState<HistoriqueRelanceDto[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchHistorique = useCallback(async () => {
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) params.append("organisationId", filters.organisationId)
      if (filters?.limit) params.append("limit", String(filters.limit))

      const queryString = params.toString()
      const endpoint = queryString ? `/historique-relances?${queryString}` : "/historique-relances"

      const data = await api.get<HistoriqueRelanceDto[]>(endpoint)
      setHistorique(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement de l'historique"))
    }
  }, [filters])

  useEffect(() => {
    fetchHistorique()
  }, [fetchHistorique])

  return {
    historique,
    error,
    refetch: fetchHistorique,
  }
}

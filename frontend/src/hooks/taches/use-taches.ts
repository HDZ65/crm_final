"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type {
  TacheDto,
  TacheStatsDto,
  TacheFilters,
  CreateTacheDto,
  UpdateTacheDto,
} from "@/types/tache"

export function useTaches(filters?: TacheFilters) {
  const [taches, setTaches] = useState<TacheDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTaches = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.organisationId) params.append("organisationId", filters.organisationId)
      if (filters?.assigneA) params.append("assigneA", filters.assigneA)
      if (filters?.clientId) params.append("clientId", filters.clientId)
      if (filters?.contratId) params.append("contratId", filters.contratId)
      if (filters?.factureId) params.append("factureId", filters.factureId)
      if (filters?.statut) params.append("statut", filters.statut)
      if (filters?.type) params.append("type", filters.type)
      if (filters?.enRetard) params.append("enRetard", "true")

      const queryString = params.toString()
      const endpoint = queryString ? `/taches?${queryString}` : "/taches"

      const data = await api.get<TacheDto[]>(endpoint)
      setTaches(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des tâches"))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTaches()
  }, [fetchTaches])

  return {
    taches,
    loading,
    error,
    refetch: fetchTaches,
  }
}

export function useTacheStats(organisationId: string | undefined) {
  const [stats, setStats] = useState<TacheStatsDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    if (!organisationId) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.get<TacheStatsDto>(`/taches/stats?organisationId=${organisationId}`)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des stats"))
    } finally {
      setLoading(false)
    }
  }, [organisationId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

export function useMyTaches(periode?: 'jour' | 'semaine') {
  const [taches, setTaches] = useState<TacheDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTaches = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = periode ? `?periode=${periode}` : ''
      const data = await api.get<TacheDto[]>(`/taches/me${params}`)
      setTaches(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement de vos tâches"))
    } finally {
      setLoading(false)
    }
  }, [periode])

  useEffect(() => {
    fetchTaches()
  }, [fetchTaches])

  return {
    taches,
    loading,
    error,
    refetch: fetchTaches,
  }
}

export function useTacheMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createTache = useCallback(async (data: CreateTacheDto): Promise<TacheDto | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.post<TacheDto>("/taches", data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la création"))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTache = useCallback(async (id: string, data: UpdateTacheDto): Promise<TacheDto | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}`, data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la mise à jour"))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTache = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/taches/${id}`)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la suppression"))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const marquerEnCours = useCallback(async (id: string): Promise<TacheDto | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}/en-cours`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du changement de statut"))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const marquerTerminee = useCallback(async (id: string): Promise<TacheDto | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}/terminee`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du changement de statut"))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const marquerAnnulee = useCallback(async (id: string): Promise<TacheDto | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}/annulee`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du changement de statut"))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createTache,
    updateTache,
    deleteTache,
    marquerEnCours,
    marquerTerminee,
    marquerAnnulee,
  }
}

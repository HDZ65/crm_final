"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type {
  TacheDto,
  TacheStatsDto,
  TacheFilters,
  CreateTacheDto,
  UpdateTacheDto,
  PaginatedTachesDto,
} from "@/types/tache"

export function useTaches(filters?: TacheFilters) {
  const [taches, setTaches] = useState<TacheDto[]>([])
  const [error, setError] = useState<Error | null>(null)

  // Extraire les valeurs primitives pour éviter la boucle infinie
  const organisationId = filters?.organisationId
  const assigneA = filters?.assigneA
  const clientId = filters?.clientId
  const contratId = filters?.contratId
  const factureId = filters?.factureId
  const statut = filters?.statut
  const type = filters?.type
  const enRetard = filters?.enRetard

  const fetchTaches = useCallback(async () => {
    setError(null)

    try {
      const params = new URLSearchParams()
      if (organisationId) params.append("organisationId", organisationId)
      if (assigneA) params.append("assigneA", assigneA)
      if (clientId) params.append("clientId", clientId)
      if (contratId) params.append("contratId", contratId)
      if (factureId) params.append("factureId", factureId)
      if (statut) params.append("statut", statut)
      if (type) params.append("type", type)
      if (enRetard) params.append("enRetard", "true")

      const queryString = params.toString()
      const endpoint = queryString ? `/taches?${queryString}` : "/taches"

      const data = await api.get<TacheDto[]>(endpoint)
      setTaches(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des tâches"))
    }
  }, [organisationId, assigneA, clientId, contratId, factureId, statut, type, enRetard])

  useEffect(() => {
    fetchTaches()
  }, [fetchTaches])

  return {
    taches,
    error,
    refetch: fetchTaches,
  }
}

export function useTachesPaginated(filters?: TacheFilters) {
  const [data, setData] = useState<PaginatedTachesDto | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Extraire les valeurs primitives pour éviter la boucle infinie
  const organisationId = filters?.organisationId
  const assigneA = filters?.assigneA
  const clientId = filters?.clientId
  const contratId = filters?.contratId
  const factureId = filters?.factureId
  const statut = filters?.statut
  const type = filters?.type
  const enRetard = filters?.enRetard
  const search = filters?.search
  const page = filters?.page || 1
  const limit = filters?.limit || 20

  const fetchTaches = useCallback(async () => {
    setError(null)

    try {
      const params = new URLSearchParams()
      if (organisationId) params.append("organisationId", organisationId)
      if (assigneA) params.append("assigneA", assigneA)
      if (clientId) params.append("clientId", clientId)
      if (contratId) params.append("contratId", contratId)
      if (factureId) params.append("factureId", factureId)
      if (statut) params.append("statut", statut)
      if (type) params.append("type", type)
      if (enRetard) params.append("enRetard", "true")
      if (search) params.append("search", search)
      params.append("page", String(page))
      params.append("limit", String(limit))

      const result = await api.get<PaginatedTachesDto>(`/taches?${params.toString()}`)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des tâches"))
    }
  }, [organisationId, assigneA, clientId, contratId, factureId, statut, type, enRetard, search, page, limit])

  // Premier chargement
  useEffect(() => {
    fetchTaches()
  }, [fetchTaches])

  return {
    taches: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 0,
    error,
    refetch: fetchTaches,
  }
}

export function useTacheStats(organisationId: string | undefined) {
  const [stats, setStats] = useState<TacheStatsDto | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    if (!organisationId) return

    setError(null)

    try {
      const data = await api.get<TacheStatsDto>(`/taches/stats?organisationId=${organisationId}`)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des stats"))
    }
  }, [organisationId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    error,
    refetch: fetchStats,
  }
}

export function useMyTaches(periode?: 'jour' | 'semaine', userId?: string) {
  const [taches, setTaches] = useState<TacheDto[]>([])
  const [error, setError] = useState<Error | null>(null)

  const fetchTaches = useCallback(async () => {
    if (!userId) {
      return
    }

    setError(null)

    try {
      const params = new URLSearchParams()
      // Filtrer par utilisateur assigné
      params.append('assigneA', userId)
      if (periode === 'jour') {
        params.append('periode', 'jour')
      } else if (periode === 'semaine') {
        params.append('periode', 'semaine')
      }

      const endpoint = `/taches?${params.toString()}`
      console.log('[useMyTaches] Fetching:', endpoint)
      const data = await api.get<TacheDto[]>(endpoint)
      console.log('[useMyTaches] Response:', data)

      // Filtrer uniquement les tâches actives (non terminées/annulées)
      const activeTaches = (data || []).filter(
        t => t.statut === 'A_FAIRE' || t.statut === 'EN_COURS'
      )
      setTaches(activeTaches)
    } catch (err) {
      console.error('[useMyTaches] Error:', err)
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement de vos tâches"))
    }
  }, [periode, userId])

  useEffect(() => {
    fetchTaches()
  }, [fetchTaches])

  return {
    taches,
    error,
    refetch: fetchTaches,
  }
}

export function useTacheMutations() {
  const [error, setError] = useState<Error | null>(null)

  const createTache = useCallback(async (data: CreateTacheDto): Promise<TacheDto | null> => {
    setError(null)

    try {
      const result = await api.post<TacheDto>("/taches", data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la création"))
      return null
    }
  }, [])

  const updateTache = useCallback(async (id: string, data: UpdateTacheDto): Promise<TacheDto | null> => {
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}`, data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la mise à jour"))
      return null
    }
  }, [])

  const deleteTache = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      await api.delete(`/taches/${id}`)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de la suppression"))
      return false
    }
  }, [])

  const marquerEnCours = useCallback(async (id: string): Promise<TacheDto | null> => {
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}/en-cours`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du changement de statut"))
      return null
    }
  }, [])

  const marquerTerminee = useCallback(async (id: string): Promise<TacheDto | null> => {
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}/terminee`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du changement de statut"))
      return null
    }
  }, [])

  const marquerAnnulee = useCallback(async (id: string): Promise<TacheDto | null> => {
    setError(null)

    try {
      const result = await api.put<TacheDto>(`/taches/${id}/annulee`)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du changement de statut"))
      return null
    }
  }, [])

  return {
    error,
    createTache,
    updateTache,
    deleteTache,
    marquerEnCours,
    marquerTerminee,
    marquerAnnulee,
  }
}

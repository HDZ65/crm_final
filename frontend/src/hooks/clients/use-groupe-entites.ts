"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  SocieteDto,
  Groupe,
  CreateSocieteDto,
  UpdateSocieteDto,
} from "@/types/societe"

// Re-export des types pour compatibilité avec les imports existants
export type {
  SocieteDto,
  Groupe,
  CreateSocieteDto,
  UpdateSocieteDto,
} from "@/types/societe"

/**
 * Hook pour récupérer les sociétés/groupes pour le filtrage
 * @param organisationId - L'ID de l'organisation pour filtrer les sociétés
 */
export function useGroupeEntites(organisationId?: string | null) {
  const [societes, setSocietes] = useState<SocieteDto[]>([])
  const { loading, error, execute } = useApi<SocieteDto[]>()

  const fetchSocietes = useCallback(async () => {
    if (!organisationId) {
      setSocietes([])
      return
    }
    try {
      const data = await execute(() => api.get(`/societes/groupes?organisationId=${organisationId}`))
      if (data) {
        setSocietes(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, organisationId])

  useEffect(() => {
    fetchSocietes()
  }, [fetchSocietes])

  // Mapper les sociétés vers le format Groupe pour compatibilité avec l'UI
  const groupes: Groupe[] = societes.map((s) => ({
    id: s.id,
    nom: s.raisonSociale,
  }))

  return {
    societes,
    groupes,
    loading,
    error,
    refetch: fetchSocietes,
  }
}

/**
 * Hook pour récupérer une société par ID
 */
export function useSociete(id: string | null) {
  const [societe, setSociete] = useState<SocieteDto | null>(null)
  const { loading, error, execute } = useApi<SocieteDto>()

  const fetchSociete = useCallback(async () => {
    if (!id) return
    try {
      const data = await execute(() => api.get(`/societes/${id}`))
      if (data) {
        setSociete(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, id])

  useEffect(() => {
    fetchSociete()
  }, [fetchSociete])

  return {
    societe,
    loading,
    error,
    refetch: fetchSociete,
  }
}

/**
 * Hook pour créer une société
 */
export function useCreateSociete() {
  const { loading, error, execute } = useApi<SocieteDto>()

  const createSociete = useCallback(
    async (data: CreateSocieteDto) => {
      return execute(() => api.post("/societes", data))
    },
    [execute]
  )

  return {
    createSociete,
    loading,
    error,
  }
}

/**
 * Hook pour mettre à jour une société
 */
export function useUpdateSociete() {
  const { loading, error, execute } = useApi<SocieteDto>()

  const updateSociete = useCallback(
    async (id: string, data: UpdateSocieteDto) => {
      return execute(() => api.put(`/societes/${id}`, data))
    },
    [execute]
  )

  return {
    updateSociete,
    loading,
    error,
  }
}

/**
 * Hook pour supprimer une société
 */
export function useDeleteSociete() {
  const { loading, error, execute } = useApi<void>()

  const deleteSociete = useCallback(
    async (id: string) => {
      return execute(() => api.delete(`/societes/${id}`))
    },
    [execute]
  )

  return {
    deleteSociete,
    loading,
    error,
  }
}

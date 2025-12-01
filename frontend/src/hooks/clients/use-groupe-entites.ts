"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

export interface SocieteDto {
  id: string
  organisationId: string
  raisonSociale: string
  siren: string
  numeroTVA: string
  createdAt: string
  updatedAt: string
}

export interface Groupe {
  id: string
  nom: string
}

/**
 * Hook pour récupérer les sociétés/groupes pour le filtrage
 */
export function useGroupeEntites() {
  const [societes, setSocietes] = useState<SocieteDto[]>([])
  const { loading, error, execute } = useApi<SocieteDto[]>()

  const fetchSocietes = useCallback(async () => {
    try {
      const data = await execute(() => api.get("/societes/groupes"))
      if (data) {
        setSocietes(data)
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute])

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

export interface CreateSocieteDto {
  organisationId: string
  raisonSociale: string
  siren: string
  numeroTVA: string
}

export interface UpdateSocieteDto {
  raisonSociale?: string
  siren?: string
  numeroTVA?: string
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

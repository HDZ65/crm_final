"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { GammeDto, Gamme, CreateGammeDto, UpdateGammeDto } from "@/types/gamme"

/**
 * Mapper un GammeDto vers un Gamme pour l'affichage
 */
function mapGammeToDisplay(gamme: GammeDto): Gamme {
  return {
    id: gamme.id,
    societeId: gamme.societeId,
    name: gamme.nom,
    description: gamme.description,
    icon: gamme.icone,
    active: gamme.actif,
    createdAt: gamme.createdAt,
    updatedAt: gamme.updatedAt,
  }
}

export interface UseGammeFilters {
  societeId?: string
  fetchAll?: boolean
}

/**
 * Hook pour récupérer la liste des gammes
 * @param filters - Filtres optionnels (societeId, fetchAll)
 */
export function useGammes(filters?: UseGammeFilters) {
  const [gammes, setGammes] = useState<Gamme[]>([])
  const { loading, error, execute } = useApi<GammeDto[]>()

  const fetchGammes = useCallback(async () => {
    // Ne pas appeler l'API si pas de societeId et pas fetchAll
    if (!filters?.societeId && !filters?.fetchAll) {
      setGammes([])
      return
    }

    try {
      const endpoint = filters?.societeId
        ? `/gammes?societeId=${filters.societeId}`
        : "/gammes"
      const data = await execute(() => api.get(endpoint))
      if (data) {
        setGammes(data.map(mapGammeToDisplay))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.societeId, filters?.fetchAll])

  useEffect(() => {
    fetchGammes()
  }, [fetchGammes])

  return {
    gammes,
    loading,
    error,
    refetch: fetchGammes,
  }
}

/**
 * Hook pour récupérer une gamme par son ID
 */
export function useGamme(id: string | null) {
  const [gamme, setGamme] = useState<Gamme | null>(null)
  const { loading, error, execute } = useApi<GammeDto>()

  const fetchGamme = useCallback(async () => {
    if (!id) return
    try {
      const data = await execute(() => api.get(`/gammes/${id}`))
      if (data) {
        setGamme(mapGammeToDisplay(data))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, id])

  useEffect(() => {
    fetchGamme()
  }, [fetchGamme])

  return {
    gamme,
    loading,
    error,
    refetch: fetchGamme,
  }
}

/**
 * Hook pour créer une gamme
 */
export function useCreateGamme() {
  const { loading, error, execute } = useApi<GammeDto>()

  const createGamme = useCallback(
    async (data: CreateGammeDto) => {
      const result = await execute(() => api.post("/gammes", data))
      return result ? mapGammeToDisplay(result) : null
    },
    [execute]
  )

  return {
    createGamme,
    loading,
    error,
  }
}

/**
 * Hook pour mettre à jour une gamme
 */
export function useUpdateGamme() {
  const { loading, error, execute } = useApi<GammeDto>()

  const updateGamme = useCallback(
    async (id: string, data: UpdateGammeDto) => {
      const result = await execute(() => api.put(`/gammes/${id}`, data))
      return result ? mapGammeToDisplay(result) : null
    },
    [execute]
  )

  return {
    updateGamme,
    loading,
    error,
  }
}

/**
 * Hook pour supprimer une gamme
 */
export function useDeleteGamme() {
  const { loading, error, execute } = useApi<void>()

  const deleteGamme = useCallback(
    async (id: string) => {
      return execute(() => api.delete(`/gammes/${id}`))
    },
    [execute]
  )

  return {
    deleteGamme,
    loading,
    error,
  }
}

/**
 * Hook combinant toutes les mutations gamme
 */
export function useGammeMutations() {
  const { createGamme, loading: createLoading, error: createError } = useCreateGamme()
  const { updateGamme, loading: updateLoading, error: updateError } = useUpdateGamme()
  const { deleteGamme, loading: deleteLoading, error: deleteError } = useDeleteGamme()

  return {
    createGamme,
    updateGamme,
    deleteGamme,
    loading: createLoading || updateLoading || deleteLoading,
    error: createError || updateError || deleteError,
  }
}

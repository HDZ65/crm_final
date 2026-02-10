"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getGammesByOrganisation,
  createGamme as createGammeAction,
  updateGamme as updateGammeAction,
  deleteGamme as deleteGammeAction,
} from "@/actions/catalogue"
import type { Gamme, CreateGammeRequest, UpdateGammeRequest } from "@proto/products/products"

export interface UseGammeFilters {
  organisationId?: string
  actif?: boolean
}

/**
 * Hook pour récupérer la liste des gammes
 * @param filters - Filtres optionnels (organisationId, actif)
 */
export function useGammes(filters?: UseGammeFilters) {
  const [gammes, setGammes] = useState<Gamme[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchGammes = useCallback(async () => {
    if (!filters?.organisationId) {
      setGammes([])
      return
    }

    setError(null)

    try {
      const result = await getGammesByOrganisation({
        organisationId: filters.organisationId,
        actif: filters.actif,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const gammesData = result.data?.gammes || []
      setGammes(gammesData as Gamme[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des gammes")
    }
  }, [filters?.organisationId, filters?.actif])

  useEffect(() => {
    fetchGammes()
  }, [fetchGammes])

  return {
    gammes,
    error,
    refetch: fetchGammes,
  }
}

/**
 * Hook pour créer une gamme
 */
export function useCreateGamme() {
  const [error, setError] = useState<string | null>(null)

  const createGamme = useCallback(async (data: CreateGammeRequest): Promise<Gamme | null> => {
    setError(null)

    try {
      const result = await createGammeAction({
        organisationId: data.organisationId,
        nom: data.nom,
        description: data.description,
        code: data.code,
        icone: data.icone,
        ordre: data.ordre,
      })

      if (result.error) {
        setError(result.error)
        return null
      }

      return (result.data as Gamme) ?? null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la création de la gamme"
      setError(errorMsg)
      return null
    }
  }, [])

  return {
    createGamme,
    error,
  }
}

/**
 * Hook pour mettre à jour une gamme
 */
export function useUpdateGamme() {
  const [error, setError] = useState<string | null>(null)

  const updateGamme = useCallback(async (id: string, data: Omit<UpdateGammeRequest, "id">): Promise<Gamme | null> => {
    setError(null)

    try {
      const result = await updateGammeAction({
        id,
        nom: data.nom,
        description: data.description,
        code: data.code,
        icone: data.icone,
        ordre: data.ordre,
        actif: data.actif,
      })

      if (result.error) {
        setError(result.error)
        return null
      }

      return (result.data as Gamme) ?? null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la mise à jour de la gamme"
      setError(errorMsg)
      return null
    }
  }, [])

  return {
    updateGamme,
    error,
  }
}

/**
 * Hook pour supprimer une gamme
 */
export function useDeleteGamme() {
  const [error, setError] = useState<string | null>(null)

  const deleteGamme = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      const result = await deleteGammeAction(id)

      if (result.error) {
        setError(result.error)
        return false
      }

      return result.data?.success ?? false
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la suppression de la gamme"
      setError(errorMsg)
      return false
    }
  }, [])

  return {
    deleteGamme,
    error,
  }
}

/**
 * Hook combinant toutes les mutations gamme
 */
export function useGammeMutations() {
  const { createGamme, error: createError } = useCreateGamme()
  const { updateGamme, error: updateError } = useUpdateGamme()
  const { deleteGamme, error: deleteError } = useDeleteGamme()

  return {
    createGamme,
    updateGamme,
    deleteGamme,
    error: createError || updateError || deleteError,
  }
}

"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  listSocietesByOrganisation,
  getSociete as getSocieteAction,
  createSociete as createSocieteAction,
  updateSociete as updateSocieteAction,
  deleteSociete as deleteSocieteAction,
  type SocieteDto,
  type CreateSocieteInput,
  type UpdateSocieteInput,
} from "@/actions/societes"

// Re-export des types pour compatibilité avec les imports existants
export type { SocieteDto, CreateSocieteInput as CreateSocieteDto, UpdateSocieteInput as UpdateSocieteDto } from "@/actions/societes"

export interface Groupe {
  id: string
  nom: string
}

/**
 * Hook pour récupérer les sociétés pour le filtrage
 * @param organisationId - L'ID de l'organisation pour filtrer les sociétés
 */
export function useSocietes(organisationId?: string | null) {
  const [societes, setSocietes] = useState<SocieteDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchSocietes = useCallback(async () => {
    if (!organisationId) {
      setSocietes([])
      return
    }
    setError(null)
    try {
      const result = await listSocietesByOrganisation(organisationId)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setSocietes(result.data)
      }
    } finally {
      // Fetch complete
    }
  }, [organisationId])

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
    error,
    refetch: fetchSocietes,
  }
}

/**
 * Hook pour récupérer une société par ID
 */
export function useSociete(id: string | null) {
  const [societe, setSociete] = useState<SocieteDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSociete = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const result = await getSocieteAction(id)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setSociete(result.data)
      }
    } finally {
      // Fetch complete
    }
  }, [id])

  useEffect(() => {
    fetchSociete()
  }, [fetchSociete])

  return {
    societe,
    error,
    refetch: fetchSociete,
  }
}

/**
 * Hook pour créer une société
 */
export function useCreateSociete() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const createSociete = useCallback(
    async (data: CreateSocieteInput): Promise<SocieteDto | null> => {
      setError(null)
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await createSocieteAction(data)
          if (result.error) {
            setError(result.error)
            resolve(null)
          } else {
            resolve(result.data)
          }
        })
      })
    },
    []
  )

  return {
    createSociete,
    loading: isPending,
    error,
  }
}

/**
 * Hook pour mettre à jour une société
 */
export function useUpdateSociete() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const updateSociete = useCallback(
    async (id: string, data: Omit<UpdateSocieteInput, "id">): Promise<SocieteDto | null> => {
      setError(null)
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await updateSocieteAction({ id, ...data })
          if (result.error) {
            setError(result.error)
            resolve(null)
          } else {
            resolve(result.data)
          }
        })
      })
    },
    []
  )

  return {
    updateSociete,
    loading: isPending,
    error,
  }
}

/**
 * Hook pour supprimer une société
 */
export function useDeleteSociete() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const deleteSociete = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)
      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await deleteSocieteAction(id)
          if (result.error) {
            setError(result.error)
            resolve(false)
          } else {
            resolve(true)
          }
        })
      })
    },
    []
  )

  return {
    deleteSociete,
    loading: isPending,
    error,
  }
}

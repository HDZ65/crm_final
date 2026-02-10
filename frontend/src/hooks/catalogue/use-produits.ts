"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getProduitsByOrganisation,
  createProduit as createProduitAction,
  updateProduit as updateProduitAction,
  deleteProduit as deleteProduitAction,
} from "@/actions/catalogue"
import type { Produit, CreateProduitRequest, UpdateProduitRequest } from "@proto/products/products"
import { CategorieProduit, TypeProduit } from "@proto/products/products"
import { CATEGORIE_PRODUIT_LABELS, TYPE_PRODUIT_LABELS } from "@/lib/ui/labels/product"

// Re-export proto enums and labels for convenience
export { CategorieProduit, TypeProduit }
export { CATEGORIE_PRODUIT_LABELS, TYPE_PRODUIT_LABELS }

export interface UseProduitFilters {
  organisationId?: string
  gammeId?: string
  actif?: boolean
}

/**
 * Hook pour récupérer la liste des produits
 * @param filters - Filtres optionnels (organisationId, gammeId, actif)
 */
export function useProduits(filters?: UseProduitFilters) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchProduits = useCallback(async () => {
    if (!filters?.organisationId) {
      setProduits([])
      return
    }

    setError(null)

    try {
      const result = await getProduitsByOrganisation({
        organisationId: filters.organisationId,
        gammeId: filters.gammeId,
        actif: filters.actif,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setProduits(result.data?.produits || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des produits")
    }
  }, [filters?.organisationId, filters?.gammeId, filters?.actif])

  useEffect(() => {
    fetchProduits()
  }, [fetchProduits])

  return {
    produits,
    error,
    refetch: fetchProduits,
  }
}

/**
 * Hook pour créer un produit
 */
export function useCreateProduit() {
  const [error, setError] = useState<string | null>(null)

  const createProduit = useCallback(async (data: CreateProduitRequest): Promise<Produit | null> => {
    setError(null)

    try {
      const result = await createProduitAction(data)

      if (result.error) {
        setError(result.error)
        return null
      }

      return (result.data as unknown as Produit) ?? null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la création du produit"
      setError(errorMsg)
      return null
    }
  }, [])

  return {
    createProduit,
    error,
  }
}

/**
 * Hook pour mettre à jour un produit
 */
export function useUpdateProduit() {
  const [error, setError] = useState<string | null>(null)

  const updateProduit = useCallback(async (id: string, data: Omit<UpdateProduitRequest, "id">): Promise<Produit | null> => {
    setError(null)

    try {
      const result = await updateProduitAction({ id, ...data } as any)

      if (result.error) {
        setError(result.error)
        return null
      }

      return (result.data as unknown as Produit) ?? null
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la mise à jour du produit"
      setError(errorMsg)
      return null
    }
  }, [])

  return {
    updateProduit,
    error,
  }
}

/**
 * Hook pour supprimer un produit
 */
export function useDeleteProduit() {
  const [error, setError] = useState<string | null>(null)

  const deleteProduit = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      const result = await deleteProduitAction(id)

      if (result.error) {
        setError(result.error)
        return false
      }

      return result.data?.success ?? false
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la suppression du produit"
      setError(errorMsg)
      return false
    }
  }, [])

  return {
    deleteProduit,
    error,
  }
}

/**
 * Hook combinant toutes les mutations produit
 */
export function useProduitMutations() {
  const { createProduit, error: createError } = useCreateProduit()
  const { updateProduit, error: updateError } = useUpdateProduit()
  const { deleteProduit, error: deleteError } = useDeleteProduit()

  return {
    createProduit,
    updateProduit,
    deleteProduit,
    error: createError || updateError || deleteError,
  }
}

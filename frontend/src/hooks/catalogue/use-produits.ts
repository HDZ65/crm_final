"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { ProduitDto, Product, CreateProduitDto, UpdateProduitDto } from "@/types/product"

/**
 * Mapper un ProduitDto vers un Product pour l'affichage
 */
function mapProduitToProduct(produit: ProduitDto): Product {
  return {
    id: produit.id,
    societeId: produit.societeId,
    gammeId: produit.gammeId,
    name: produit.nom,
    description: produit.description,
    type: produit.type,
    category: produit.categorie,
    status: produit.actif ? "Disponible" : "Archivé",
    price: produit.prix,
    taxRate: produit.tauxTVA,
    priceTTC: produit.prixTTC,
    currency: produit.devise,
    sku: produit.sku,
    supplier: produit.fournisseur,
    actif: produit.actif,
    // Champs promotion
    promotionActive: produit.promotionActive ?? false,
    promotionPourcentage: produit.promotionPourcentage,
    promotionDateDebut: produit.promotionDateDebut,
    promotionDateFin: produit.promotionDateFin,
    prixPromo: produit.prixPromo,
    prixPromoTTC: produit.prixPromoTTC,
    createdAt: produit.createdAt,
    updatedAt: produit.updatedAt,
  }
}

export interface UseProduitFilters {
  societeId?: string
  gammeId?: string
  fetchAll?: boolean
}

/**
 * Hook pour récupérer la liste des produits
 * @param filters - Filtres optionnels (societeId, gammeId, fetchAll)
 */
export function useProduits(filters?: UseProduitFilters) {
  const [produits, setProduits] = useState<Product[]>([])
  const { loading, error, execute } = useApi<ProduitDto[]>()

  const fetchProduits = useCallback(async () => {
    // Ne pas appeler l'API si pas de filtre et pas fetchAll
    if (!filters?.gammeId && !filters?.societeId && !filters?.fetchAll) {
      setProduits([])
      return
    }

    try {
      const params = new URLSearchParams()
      if (filters?.gammeId) {
        params.append("gammeId", filters.gammeId)
      } else if (filters?.societeId) {
        params.append("societeId", filters.societeId)
      }
      // Si fetchAll est true, on n'ajoute pas de paramètres pour récupérer tous les produits

      const queryString = params.toString()
      const endpoint = queryString ? `/produits?${queryString}` : "/produits"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setProduits(data.map(mapProduitToProduct))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.societeId, filters?.gammeId, filters?.fetchAll])

  useEffect(() => {
    fetchProduits()
  }, [fetchProduits])

  return {
    produits,
    loading,
    error,
    refetch: fetchProduits,
  }
}

/**
 * Hook pour récupérer un produit par son ID
 */
export function useProduit(id: string | null) {
  const [produit, setProduit] = useState<Product | null>(null)
  const { loading, error, execute } = useApi<ProduitDto>()

  const fetchProduit = useCallback(async () => {
    if (!id) return
    try {
      const data = await execute(() => api.get(`/produits/${id}`))
      if (data) {
        setProduit(mapProduitToProduct(data))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, id])

  useEffect(() => {
    fetchProduit()
  }, [fetchProduit])

  return {
    produit,
    loading,
    error,
    refetch: fetchProduit,
  }
}

/**
 * Hook pour créer un produit
 */
export function useCreateProduit() {
  const { loading, error, execute } = useApi<ProduitDto>()

  const createProduit = useCallback(
    async (data: CreateProduitDto) => {
      const result = await execute(() => api.post("/produits", data))
      return result ? mapProduitToProduct(result) : null
    },
    [execute]
  )

  return {
    createProduit,
    loading,
    error,
  }
}

/**
 * Hook pour mettre à jour un produit
 */
export function useUpdateProduit() {
  const { loading, error, execute } = useApi<ProduitDto>()

  const updateProduit = useCallback(
    async (id: string, data: UpdateProduitDto) => {
      const result = await execute(() => api.put(`/produits/${id}`, data))
      return result ? mapProduitToProduct(result) : null
    },
    [execute]
  )

  return {
    updateProduit,
    loading,
    error,
  }
}

/**
 * Hook pour supprimer un produit
 */
export function useDeleteProduit() {
  const { loading, error, execute } = useApi<void>()

  const deleteProduit = useCallback(
    async (id: string) => {
      return execute(() => api.delete(`/produits/${id}`))
    },
    [execute]
  )

  return {
    deleteProduit,
    loading,
    error,
  }
}

/**
 * Hook combinant toutes les mutations produit
 */
export function useProduitMutations() {
  const { createProduit, loading: createLoading, error: createError } = useCreateProduit()
  const { updateProduit, loading: updateLoading, error: updateError } = useUpdateProduit()
  const { deleteProduit, loading: deleteLoading, error: deleteError } = useDeleteProduit()

  return {
    createProduit,
    updateProduit,
    deleteProduit,
    loading: createLoading || updateLoading || deleteLoading,
    error: createError || updateError || deleteError,
  }
}

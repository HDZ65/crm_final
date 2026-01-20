"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getProduitsByOrganisation,
  createProduit as createProduitAction,
  updateProduit as updateProduitAction,
  deleteProduit as deleteProduitAction,
} from "@/actions/catalogue"
import { CategorieProduit, TypeProduit } from "@/types/product"
import type { Product, CreateProduitDto, UpdateProduitDto, ProduitDto } from "@/types/product"

interface GrpcProduitLike {
  id: string
  organisationId: string
  gammeId: string
  sku: string
  nom: string
  description: string
  categorie: number | string
  type: number | string
  prix: number
  tauxTva: number
  devise: string
  actif: boolean
  promotionActive: boolean
  prixPromotion: number
  dateDebutPromotion: string
  dateFinPromotion: string
  imageUrl: string
  codeExterne: string
  metadata: string
  createdAt: string
  updatedAt: string
}

/**
 * Convertir un Produit gRPC vers ProduitDto local
 */
function convertGrpcProduitToDto(produit: GrpcProduitLike): ProduitDto {
  return {
    id: produit.id,
    organisationId: produit.organisationId,
    gammeId: produit.gammeId,
    sku: produit.sku,
    nom: produit.nom,
    description: produit.description,
    // Conversion des enums gRPC (strings) vers enums locaux (numbers)
    categorie: convertGrpcCategorie(produit.categorie),
    type: convertGrpcType(produit.type),
    prix: produit.prix,
    tauxTva: produit.tauxTva,
    devise: produit.devise,
    actif: produit.actif,
    promotionActive: produit.promotionActive,
    prixPromotion: produit.prixPromotion,
    dateDebutPromotion: produit.dateDebutPromotion,
    dateFinPromotion: produit.dateFinPromotion,
    imageUrl: produit.imageUrl,
    codeExterne: produit.codeExterne,
    metadata: produit.metadata,
    createdAt: produit.createdAt,
    updatedAt: produit.updatedAt,
  }
}

function convertGrpcCategorie(categorie: number | string): CategorieProduit {
  const stringMapping: Record<string, CategorieProduit> = {
    CATEGORIE_PRODUIT_UNSPECIFIED: CategorieProduit.CATEGORIE_UNSPECIFIED,
    ASSURANCE: CategorieProduit.ASSISTANCE,
    PREVOYANCE: CategorieProduit.BLEULEC_ASSUR,
    EPARGNE: CategorieProduit.DECES_TOUTES_CAUSES,
    SERVICE: CategorieProduit.SANTE,
    ACCESSOIRE: CategorieProduit.PROTECTION_JURIDIQUE,
  }
  const numericMapping: Record<number, CategorieProduit> = {
    0: CategorieProduit.CATEGORIE_UNSPECIFIED,
    1: CategorieProduit.ASSISTANCE,
    2: CategorieProduit.BLEULEC_ASSUR,
    3: CategorieProduit.DECES_TOUTES_CAUSES,
    4: CategorieProduit.SANTE,
    5: CategorieProduit.PROTECTION_JURIDIQUE,
  }
  if (typeof categorie === "number") {
    return numericMapping[categorie] ?? CategorieProduit.CATEGORIE_UNSPECIFIED
  }
  return stringMapping[categorie] ?? CategorieProduit.CATEGORIE_UNSPECIFIED
}

function convertGrpcType(type: number | string): TypeProduit {
  const stringMapping: Record<string, TypeProduit> = {
    TYPE_PRODUIT_UNSPECIFIED: TypeProduit.TYPE_UNSPECIFIED,
    INTERNE: TypeProduit.INTERNE,
    PARTENAIRE: TypeProduit.PARTENAIRE,
  }
  const numericMapping: Record<number, TypeProduit> = {
    0: TypeProduit.TYPE_UNSPECIFIED,
    1: TypeProduit.INTERNE,
    2: TypeProduit.PARTENAIRE,
  }
  if (typeof type === "number") {
    return numericMapping[type] ?? TypeProduit.TYPE_UNSPECIFIED
  }
  return stringMapping[type] ?? TypeProduit.TYPE_UNSPECIFIED
}

/**
 * Convertir l'enum local vers enum gRPC
 */
function convertLocalCategorieToGrpc(categorie: CategorieProduit): string {
  const mapping: Record<number, string> = {
    [CategorieProduit.CATEGORIE_UNSPECIFIED]: "CATEGORIE_PRODUIT_UNSPECIFIED",
    [CategorieProduit.ASSISTANCE]: "ASSURANCE",
    [CategorieProduit.BLEULEC]: "ASSURANCE",
    [CategorieProduit.BLEULEC_ASSUR]: "PREVOYANCE",
    [CategorieProduit.DECES_TOUTES_CAUSES]: "EPARGNE",
    [CategorieProduit.DEPENDANCE]: "EPARGNE",
    [CategorieProduit.GARANTIE_ACCIDENTS_VIE]: "SERVICE",
    [CategorieProduit.MULTIRISQUES_HABITATION]: "SERVICE",
    [CategorieProduit.OBSEQUE]: "ACCESSOIRE",
    [CategorieProduit.PROTECTION_JURIDIQUE]: "ACCESSOIRE",
    [CategorieProduit.SANTE]: "SERVICE",
  }
  return mapping[categorie] ?? "CATEGORIE_PRODUIT_UNSPECIFIED"
}

/**
 * Convertir l'enum TypeProduit local vers enum gRPC
 */
function convertLocalTypeToGrpc(type: TypeProduit): string {
  const mapping: Record<number, string> = {
    [TypeProduit.TYPE_UNSPECIFIED]: "TYPE_PRODUIT_UNSPECIFIED",
    [TypeProduit.INTERNE]: "INTERNE",
    [TypeProduit.PARTENAIRE]: "PARTENAIRE",
  }
  return mapping[type] ?? "TYPE_PRODUIT_UNSPECIFIED"
}

// Map categorie enum to display string
function mapCategorie(categorie: CategorieProduit): string {
  const labels: Record<number, string> = {
    [CategorieProduit.CATEGORIE_UNSPECIFIED]: "Non spécifié",
    [CategorieProduit.ASSISTANCE]: "Assistance",
    [CategorieProduit.BLEULEC]: "Bleulec",
    [CategorieProduit.BLEULEC_ASSUR]: "Bleulec Assur",
    [CategorieProduit.DECES_TOUTES_CAUSES]: "Décès toutes causes",
    [CategorieProduit.DEPENDANCE]: "Dépendance",
    [CategorieProduit.GARANTIE_ACCIDENTS_VIE]: "Garantie des accidents de la vie",
    [CategorieProduit.MULTIRISQUES_HABITATION]: "Multirisques habitation",
    [CategorieProduit.OBSEQUE]: "Obsèque",
    [CategorieProduit.PROTECTION_JURIDIQUE]: "Protection juridique",
    [CategorieProduit.SANTE]: "Santé",
  }
  return labels[categorie] || "Non spécifié"
}

// Map type enum to display string
function mapType(type: TypeProduit): string {
  const labels: Record<number, string> = {
    [TypeProduit.TYPE_UNSPECIFIED]: "Non spécifié",
    [TypeProduit.INTERNE]: "Interne",
    [TypeProduit.PARTENAIRE]: "Partenaire",
  }
  return labels[type] || "Non spécifié"
}

/**
 * Mapper un ProduitDto vers un Product pour l'affichage
 */
function mapProduitToProduct(produit: ProduitDto): Product {
  // Calculate TTC price
  const priceTTC = produit.prix * (1 + produit.tauxTva / 100)

  return {
    id: produit.id,
    organisationId: produit.organisationId,
    gammeId: produit.gammeId || undefined,
    name: produit.nom,
    description: produit.description,
    type: mapType(produit.type),
    category: mapCategorie(produit.categorie),
    status: produit.actif ? "Disponible" : "Archivé",
    price: produit.prix,
    taxRate: produit.tauxTva,
    priceTTC,
    currency: produit.devise,
    sku: produit.sku,
    actif: produit.actif,
    // Champs promotion
    promotionActive: produit.promotionActive,
    promotionPrice: produit.prixPromotion || undefined,
    promotionDateDebut: produit.dateDebutPromotion || undefined,
    promotionDateFin: produit.dateFinPromotion || undefined,
    imageUrl: produit.imageUrl || undefined,
    codeExterne: produit.codeExterne || undefined,
    createdAt: produit.createdAt,
    updatedAt: produit.updatedAt,
  }
}

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
  const [produits, setProduits] = useState<Product[]>([])
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

      // Convertir les types gRPC vers types locaux
      const produitsData = (result.data?.produits || []).map(convertGrpcProduitToDto)
      setProduits(produitsData.map(mapProduitToProduct))
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

  const createProduit = useCallback(async (data: CreateProduitDto): Promise<Product | null> => {
    setError(null)

    try {
      const result = await createProduitAction({
        organisationId: data.organisationId,
        gammeId: data.gammeId,
        nom: data.nom,
        sku: data.sku,
        description: data.description,
        type: convertLocalTypeToGrpc(data.type) as any,
        categorie: convertLocalCategorieToGrpc(data.categorie) as any,
        prix: data.prix,
        tauxTva: data.tauxTva,
        devise: data.devise,
        imageUrl: data.imageUrl,
        codeExterne: data.codeExterne,
        metadata: data.metadata,
      })

      if (result.error) {
        setError(result.error)
        return null
      }

      return result.data ? mapProduitToProduct(convertGrpcProduitToDto(result.data as unknown as GrpcProduitLike)) : null
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

  const updateProduit = useCallback(async (id: string, data: Omit<UpdateProduitDto, "id">): Promise<Product | null> => {
    setError(null)

    try {
      const result = await updateProduitAction({
        id,
        gammeId: data.gammeId,
        nom: data.nom,
        sku: data.sku,
        description: data.description,
        type: data.type !== undefined ? convertLocalTypeToGrpc(data.type) : undefined,
        categorie: data.categorie !== undefined ? convertLocalCategorieToGrpc(data.categorie) : undefined,
        prix: data.prix,
        tauxTva: data.tauxTva,
        devise: data.devise,
        actif: data.actif,
        imageUrl: data.imageUrl,
        codeExterne: data.codeExterne,
        metadata: data.metadata,
      } as any)

      if (result.error) {
        setError(result.error)
        return null
      }

      return result.data ? mapProduitToProduct(convertGrpcProduitToDto(result.data as unknown as GrpcProduitLike)) : null
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

"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getConditionsPaiement,
  getModelesDistribution,
  getStatutsContrat,
  getPartenaires,
  type ConditionPaiement,
  type ModeleDistribution,
  type StatutContrat,
  type PartenaireMarqueBlanche,
} from "@/actions/reference-data"
import { getClient } from "@/actions/clients"
import type { AdresseDto, Adresse } from "@/types/client"

// Re-export des types pour compatibilité
export type ConditionPaiementDto = ConditionPaiement
export type ModeleDistributionDto = ModeleDistribution
export type StatutContratDto = StatutContrat
export type PartenaireDto = PartenaireMarqueBlanche

// Cache global pour les données de référence
const cache: {
  conditionsPaiement: ConditionPaiement[] | null
  modelesDistribution: ModeleDistribution[] | null
  statutsContrat: StatutContrat[] | null
  partenaires: PartenaireMarqueBlanche[] | null
} = {
  conditionsPaiement: null,
  modelesDistribution: null,
  statutsContrat: null,
  partenaires: null,
}

/**
 * Hook pour récupérer les conditions de paiement
 */
export function useConditionsPaiement() {
  const [data, setData] = useState<ConditionPaiement[]>(cache.conditionsPaiement || [])
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (cache.conditionsPaiement) {
      setData(cache.conditionsPaiement)
      return cache.conditionsPaiement
    }

    setError(null)

    try {
      const result = await getConditionsPaiement()
      if (result.error) {
        setError(result.error)
        return []
      }
      if (result.data) {
        cache.conditionsPaiement = result.data
        setData(result.data)
        return result.data
      }
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
      return []
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { conditionsPaiement: data, error, refetch: fetch }
}

/**
 * Hook pour récupérer les modèles de distribution
 */
export function useModelesDistribution() {
  const [data, setData] = useState<ModeleDistribution[]>(cache.modelesDistribution || [])
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (cache.modelesDistribution) {
      setData(cache.modelesDistribution)
      return cache.modelesDistribution
    }

    setError(null)

    try {
      const result = await getModelesDistribution()
      if (result.error) {
        setError(result.error)
        return []
      }
      if (result.data) {
        cache.modelesDistribution = result.data
        setData(result.data)
        return result.data
      }
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
      return []
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { modelesDistribution: data, error, refetch: fetch }
}

/**
 * Hook pour récupérer les statuts de contrat
 */
export function useStatutsContrat() {
  const [data, setData] = useState<StatutContrat[]>(cache.statutsContrat || [])
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (cache.statutsContrat) {
      setData(cache.statutsContrat)
      return cache.statutsContrat
    }

    setError(null)

    try {
      const result = await getStatutsContrat()
      if (result.error) {
        setError(result.error)
        return []
      }
      if (result.data) {
        cache.statutsContrat = result.data
        setData(result.data)
        return result.data
      }
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
      return []
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { statutsContrat: data, error, refetch: fetch }
}

/**
 * Hook pour récupérer les partenaires
 */
export function usePartenaires(organisationId?: string) {
  const [data, setData] = useState<PartenaireMarqueBlanche[]>(cache.partenaires || [])
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!organisationId) {
      setData([])
      return []
    }

    if (cache.partenaires) {
      setData(cache.partenaires)
      return cache.partenaires
    }

    setError(null)

    try {
      const result = await getPartenaires(organisationId)
      if (result.error) {
        setError(result.error)
        return []
      }
      if (result.data) {
        cache.partenaires = result.data
        setData(result.data)
        return result.data
      }
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
      return []
    }
  }, [organisationId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { partenaires: data, error, refetch: fetch }
}

// Map Adresse gRPC to AdresseDto
function mapAdresseToDto(a: Adresse): AdresseDto {
  return {
    id: a.id,
    ligne1: a.ligne1,
    ligne2: a.ligne2 || undefined,
    codePostal: a.codePostal,
    ville: a.ville,
    pays: a.pays,
    type: a.type || undefined,
    clientId: a.clientBaseId || undefined,
  }
}

/**
 * Hook pour récupérer les adresses d'un client
 */
export function useAdressesClient(clientId: string | null) {
  const [data, setData] = useState<AdresseDto[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!clientId) {
      setData([])
      return []
    }

    setError(null)

    try {
      // Les adresses sont incluses dans la réponse getClient
      const result = await getClient(clientId)
      if (result.error) {
        setError(result.error)
        return []
      }
      if (result.data?.adresses) {
        const mapped = result.data.adresses.map(mapAdresseToDto)
        setData(mapped)
        return mapped
      }
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
      return []
    }
  }, [clientId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { adresses: data, error, refetch: fetch }
}

/**
 * Hook combiné pour toutes les données de référence nécessaires à la création d'un contrat
 */
export function useContractReferenceData(organisationId?: string) {
  const { conditionsPaiement, error: errorCP } = useConditionsPaiement()
  const { modelesDistribution, error: errorMD } = useModelesDistribution()
  const { statutsContrat, error: errorSC } = useStatutsContrat()
  const { partenaires, error: errorP } = usePartenaires(organisationId)

  return {
    conditionsPaiement,
    modelesDistribution,
    statutsContrat,
    partenaires,
    error: errorCP || errorMD || errorSC || errorP,
  }
}

/**
 * Invalider le cache des données de référence
 */
export function invalidateContractReferenceCache() {
  cache.conditionsPaiement = null
  cache.modelesDistribution = null
  cache.statutsContrat = null
  cache.partenaires = null
}

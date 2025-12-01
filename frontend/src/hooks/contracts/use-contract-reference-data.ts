"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type { AdresseDto } from "../clients/use-clients"

// Types pour les données de référence

export interface ConditionPaiementDto {
  id: string
  code: string
  nom: string
  description?: string
  delaiJours?: number
  createdAt?: string
  updatedAt?: string
}

export interface ModeleDistributionDto {
  id: string
  code: string
  nom: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface StatutContratDto {
  id: string
  code: string
  nom: string
  description?: string
  ordreAffichage?: number
  createdAt?: string
  updatedAt?: string
}

export interface PartenaireDto {
  id: string
  nom: string
  code?: string
  type?: string
  actif?: boolean
  createdAt?: string
  updatedAt?: string
}

// Cache global pour les données de référence
const cache: {
  conditionsPaiement: ConditionPaiementDto[] | null
  modelesDistribution: ModeleDistributionDto[] | null
  statutsContrat: StatutContratDto[] | null
  partenaires: PartenaireDto[] | null
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
  const [data, setData] = useState<ConditionPaiementDto[]>(cache.conditionsPaiement || [])
  const { loading, error, execute } = useApi<ConditionPaiementDto[]>()

  const fetch = useCallback(async () => {
    if (cache.conditionsPaiement) {
      setData(cache.conditionsPaiement)
      return cache.conditionsPaiement
    }
    try {
      const result = await execute(() => api.get("/conditionpaiements"))
      if (result) {
        cache.conditionsPaiement = result
        setData(result)
      }
      return result
    } catch {
      return []
    }
  }, [execute])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { conditionsPaiement: data, loading, error, refetch: fetch }
}

/**
 * Hook pour récupérer les modèles de distribution
 */
export function useModelesDistribution() {
  const [data, setData] = useState<ModeleDistributionDto[]>(cache.modelesDistribution || [])
  const { loading, error, execute } = useApi<ModeleDistributionDto[]>()

  const fetch = useCallback(async () => {
    if (cache.modelesDistribution) {
      setData(cache.modelesDistribution)
      return cache.modelesDistribution
    }
    try {
      const result = await execute(() => api.get("/modeledistributions"))
      if (result) {
        cache.modelesDistribution = result
        setData(result)
      }
      return result
    } catch {
      return []
    }
  }, [execute])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { modelesDistribution: data, loading, error, refetch: fetch }
}

/**
 * Hook pour récupérer les statuts de contrat
 */
export function useStatutsContrat() {
  const [data, setData] = useState<StatutContratDto[]>(cache.statutsContrat || [])
  const { loading, error, execute } = useApi<StatutContratDto[]>()

  const fetch = useCallback(async () => {
    if (cache.statutsContrat) {
      setData(cache.statutsContrat)
      return cache.statutsContrat
    }
    try {
      const result = await execute(() => api.get("/statutcontrats"))
      if (result) {
        cache.statutsContrat = result
        setData(result)
      }
      return result
    } catch {
      return []
    }
  }, [execute])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { statutsContrat: data, loading, error, refetch: fetch }
}

/**
 * Hook pour récupérer les partenaires
 */
export function usePartenaires() {
  const [data, setData] = useState<PartenaireDto[]>(cache.partenaires || [])
  const { loading, error, execute } = useApi<PartenaireDto[]>()

  const fetch = useCallback(async () => {
    if (cache.partenaires) {
      setData(cache.partenaires)
      return cache.partenaires
    }
    try {
      const result = await execute(() => api.get("/partenairemarqueblanches"))
      if (result) {
        cache.partenaires = result
        setData(result)
      }
      return result
    } catch {
      return []
    }
  }, [execute])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { partenaires: data, loading, error, refetch: fetch }
}

/**
 * Hook pour récupérer les adresses d'un client
 */
export function useAdressesClient(clientId: string | null) {
  const [data, setData] = useState<AdresseDto[]>([])
  const { loading, error, execute } = useApi<AdresseDto[]>()

  const fetch = useCallback(async () => {
    if (!clientId) {
      setData([])
      return []
    }
    try {
      const result = await execute(() => api.get(`/adresses?clientId=${clientId}`))
      if (result) {
        setData(result)
      }
      return result
    } catch {
      return []
    }
  }, [clientId, execute])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { adresses: data, loading, error, refetch: fetch }
}

/**
 * Hook combiné pour toutes les données de référence nécessaires à la création d'un contrat
 */
export function useContractReferenceData() {
  const { conditionsPaiement, loading: loadingCP, error: errorCP } = useConditionsPaiement()
  const { modelesDistribution, loading: loadingMD, error: errorMD } = useModelesDistribution()
  const { statutsContrat, loading: loadingSC, error: errorSC } = useStatutsContrat()
  const { partenaires, loading: loadingP, error: errorP } = usePartenaires()

  return {
    conditionsPaiement,
    modelesDistribution,
    statutsContrat,
    partenaires,
    loading: loadingCP || loadingMD || loadingSC || loadingP,
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

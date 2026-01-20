"use client"

import { useCallback, useEffect, useState } from "react"
import { getStatutClients } from "@/actions/clients"

export interface StatutClientDto {
  id: string
  code: string
  nom: string
  description?: string
  ordreAffichage: number
  createdAt?: string
  updatedAt?: string
}

// Cache global pour éviter les appels multiples
let cachedStatuts: StatutClientDto[] | null = null
let cachePromise: Promise<StatutClientDto[]> | null = null

export function useStatutClients() {
  const [statuts, setStatuts] = useState<StatutClientDto[]>(cachedStatuts || [])
  const [error, setError] = useState<string | null>(null)

  const fetchStatuts = useCallback(async () => {
    // Si déjà en cache, utiliser le cache
    if (cachedStatuts) {
      setStatuts(cachedStatuts)
      return cachedStatuts
    }

    // Si un fetch est déjà en cours, attendre le résultat
    if (cachePromise) {
      try {
        const result = await cachePromise
        setStatuts(result)
        return result
      } catch {
        // Error will be handled below
      }
    }

    setError(null)

    try {
      cachePromise = getStatutClients().then(result => {
        if (result.error) {
          throw new Error(result.error)
        }
        const data = result.data?.statuts || []
        const sorted = data.sort((a, b) => (a.ordreAffichage || 0) - (b.ordreAffichage || 0))
        cachedStatuts = sorted
        return sorted
      })

      const sorted = await cachePromise
      setStatuts(sorted)
      return sorted
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des statuts")
      cachePromise = null
      return []
    }
  }, [])

  useEffect(() => {
    fetchStatuts()
  }, [fetchStatuts])

  /**
   * Obtenir le label d'un statut par son ID
   */
  const getLabel = useCallback((statutId: string): string => {
    const statut = statuts.find(s => s.id === statutId)
    return statut?.nom || 'Inconnu'
  }, [statuts])

  /**
   * Obtenir le code d'un statut par son ID
   */
  const getCode = useCallback((statutId: string): string => {
    const statut = statuts.find(s => s.id === statutId)
    return statut?.code || ''
  }, [statuts])

  /**
   * Obtenir un statut par son code
   */
  const getByCode = useCallback((code: string): StatutClientDto | undefined => {
    return statuts.find(s => s.code.toLowerCase() === code.toLowerCase())
  }, [statuts])

  /**
   * Mapper un statutId vers un type de statut pour l'UI
   * Utilise le code ou le nom pour déterminer le type
   */
  const mapToStatus = useCallback((statutId: string): "Actif" | "Impayé" | "Suspendu" => {
    const code = getCode(statutId).toLowerCase()
    if (code === 'actif' || code === 'active') return 'Actif'
    if (code === 'impaye' || code === 'impayé') return 'Impayé'
    if (code === 'suspendu' || code === 'suspended') return 'Suspendu'
    // Fallback basé sur le nom
    const label = getLabel(statutId).toLowerCase()
    if (label.includes('actif')) return 'Actif'
    if (label.includes('impay')) return 'Impayé'
    if (label.includes('suspen')) return 'Suspendu'
    return 'Actif' // Fallback par défaut
  }, [getCode, getLabel])

  /**
   * Invalider le cache (utile après création/modification d'un statut)
   */
  const invalidateCache = useCallback(() => {
    cachedStatuts = null
    cachePromise = null
    fetchStatuts()
  }, [fetchStatuts])

  return {
    statuts,
    error,
    getLabel,
    getCode,
    getByCode,
    mapToStatus,
    refetch: fetchStatuts,
    invalidateCache,
  }
}

/**
 * Fonction utilitaire pour pré-charger les statuts au démarrage de l'app
 */
export async function preloadStatutClients(): Promise<StatutClientDto[]> {
  if (cachedStatuts) return cachedStatuts

  if (cachePromise) return cachePromise

  cachePromise = getStatutClients()
    .then(result => {
      if (result.error) {
        throw new Error(result.error)
      }
      const data = result.data?.statuts || []
      const sorted = data.sort((a, b) => (a.ordreAffichage || 0) - (b.ordreAffichage || 0))
      cachedStatuts = sorted
      return sorted
    })
    .catch(err => {
      cachePromise = null
      throw err
    })

  return cachePromise
}

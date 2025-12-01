"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"

// Types pour les expéditions
export type ExpeditionEtat =
  | "en_attente"
  | "pris_en_charge"
  | "en_transit"
  | "en_livraison"
  | "livre"
  | "echec_livraison"
  | "retourne"

export interface ExpeditionClient {
  id: string
  nom: string
  prenom: string
  entreprise: string | null
  email: string
}

export interface ExpeditionContrat {
  id: string
  referenceExterne: string
}

export interface ExpeditionTransporteur {
  id: string
  type: string
}

export interface ExpeditionDto {
  id: string
  organisationId: string
  referenceCommande: string
  trackingNumber: string
  etat: ExpeditionEtat
  nomProduit: string
  poids: number | null
  villeDestination: string
  codePostalDestination: string
  adresseDestination: string
  dateCreation: string
  dateExpedition: string | null
  dateLivraisonEstimee: string | null
  dateLivraison: string | null
  dateDernierStatut: string | null
  lieuActuel: string | null
  labelUrl: string | null
  client: ExpeditionClient | null
  contrat: ExpeditionContrat | null
  transporteur: ExpeditionTransporteur | null
  createdAt: string
  updatedAt: string
}

// Labels pour les états
export const EXPEDITION_ETAT_LABELS: Record<ExpeditionEtat, string> = {
  en_attente: "En attente",
  pris_en_charge: "Pris en charge",
  en_transit: "En transit",
  en_livraison: "En cours de livraison",
  livre: "Livré",
  echec_livraison: "Échec de livraison",
  retourne: "Retourné",
}

// Variantes de badge pour les états
export const EXPEDITION_ETAT_VARIANTS: Record<ExpeditionEtat, "default" | "secondary" | "destructive" | "outline"> = {
  en_attente: "outline",
  pris_en_charge: "secondary",
  en_transit: "secondary",
  en_livraison: "default",
  livre: "default",
  echec_livraison: "destructive",
  retourne: "destructive",
}

export interface ExpeditionsFilters {
  etat?: ExpeditionEtat
  clientId?: string
  contratId?: string
  transporteurId?: string
  dateDebut?: string
  dateFin?: string
}

/**
 * Hook pour récupérer la liste des expéditions avec détails
 *
 * Note: Les filtres etat, clientId, contratId, transporteurId, dateDebut, dateFin
 * sont envoyés mais nécessitent une mise à jour du backend pour être pris en compte.
 * Actuellement seul organisationId est supporté côté backend.
 */
export function useExpeditions(organisationId: string | null, filters?: ExpeditionsFilters) {
  const [expeditions, setExpeditions] = useState<ExpeditionDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchExpeditions = useCallback(async () => {
    if (!organisationId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("organisationId", organisationId)

      if (filters?.etat) params.append("etat", filters.etat)
      if (filters?.clientId) params.append("clientId", filters.clientId)
      if (filters?.contratId) params.append("contratId", filters.contratId)
      if (filters?.transporteurId) params.append("transporteurId", filters.transporteurId)
      if (filters?.dateDebut) params.append("dateDebut", filters.dateDebut)
      if (filters?.dateFin) params.append("dateFin", filters.dateFin)

      const data: ExpeditionDto[] = await api.get(`/expeditions/with-details?${params.toString()}`)
      setExpeditions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des expéditions"))
    } finally {
      setLoading(false)
    }
  }, [organisationId, filters?.etat, filters?.clientId, filters?.contratId, filters?.transporteurId, filters?.dateDebut, filters?.dateFin])

  useEffect(() => {
    if (organisationId) {
      fetchExpeditions()
    }
  }, [organisationId, fetchExpeditions])

  return {
    expeditions,
    loading,
    error,
    refetch: fetchExpeditions,
  }
}

/**
 * Hook pour récupérer une expédition par son ID
 */
export function useExpedition(expeditionId: string | null) {
  const [expedition, setExpedition] = useState<ExpeditionDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchExpedition = useCallback(async () => {
    if (!expeditionId) return

    setLoading(true)
    setError(null)

    try {
      const data: ExpeditionDto = await api.get(`/expeditions/${expeditionId}`)
      setExpedition(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement de l'expédition"))
    } finally {
      setLoading(false)
    }
  }, [expeditionId])

  useEffect(() => {
    if (expeditionId) {
      fetchExpedition()
    }
  }, [expeditionId, fetchExpedition])

  return {
    expedition,
    loading,
    error,
    refetch: fetchExpedition,
  }
}

/**
 * Hook pour récupérer les expéditions d'un client spécifique
 */
export function useClientExpeditions(organisationId: string | null, clientId: string | null) {
  return useExpeditions(organisationId, clientId ? { clientId } : undefined)
}

/**
 * Hook pour récupérer les expéditions d'un contrat spécifique
 */
export function useContratExpeditions(organisationId: string | null, contratId: string | null) {
  return useExpeditions(organisationId, contratId ? { contratId } : undefined)
}

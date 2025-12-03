"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import { useStatutClients } from "./use-statut-clients"
import {
  formatCreatedAgo,
  formatDateFr,
  formatAddress,
  formatLocation,
  formatIbanMasked,
  getKycVariant,
  formatFullName,
  mapStatutIdToStatus,
} from "@/lib/formatters"
import type {
  ClientFilters,
  ClientBaseDto,
  ClientDetailDto,
  ClientRow,
  ClientDetail,
  ClientStatus,
  PaiementDto,
  DocumentDto,
  EvenementDto,
} from "@/types/client"
import type { ContratSimpleDto } from "@/types/contract"

// DEPRECATED: Ces constantes sont conservées pour compatibilité temporaire
// Utilisez useStatutClients().getByCode('actif') à la place
/** @deprecated Utilisez useStatutClients() à la place */
export const STATUT_IDS = {} as Record<string, string>
/** @deprecated Utilisez useStatutClients().mapToStatus() à la place */
export const STATUT_LABELS: Record<string, ClientStatus> = {}

// Re-export des types pour compatibilité avec les imports existants
export type {
  ClientFilters,
  ClientBaseDto,
  ClientDetailDto,
  ClientRow,
  ClientDetail,
  ClientStatus,
  PaiementDto,
  DocumentDto,
  EvenementDto,
  AdresseDto,
} from "@/types/client"

export type { ContratSimpleDto as ContratDto } from "@/types/contract"

function mapClientBaseToRow(
  client: ClientBaseDto,
  mapStatusFn?: (id: string) => ClientStatus
): ClientRow {
  // Extraire les societeIds uniques des contrats
  const societeIds = [
    ...new Set(
      client.contrats
        ?.map((c) => c.societeId)
        .filter((id): id is string => !!id) || []
    ),
  ]

  return {
    id: client.id,
    name: formatFullName(client.nom, client.prenom),
    status: mapStatutIdToStatus(client.statutId, mapStatusFn),
    contracts: client.contrats?.map((c) => c.referenceExterne) || [],
    createdAgo: formatCreatedAgo(client.createdAt),
    email: client.email,
    phone: client.telephone,
    societeIds,
  }
}

function mapClientDetailDtoToDetail(
  client: ClientDetailDto,
  mapStatusFn?: (id: string) => ClientStatus
): ClientDetail {
  // Récupérer l'adresse principale (première adresse ou adresse de type 'principal')
  const primaryAddress = client.adresses?.find(a => a.type === 'principal') || client.adresses?.[0]

  const address = primaryAddress
    ? formatAddress(primaryAddress)
    : "Non renseigné"

  const location = primaryAddress
    ? formatLocation(primaryAddress)
    : "Non renseigné"

  return {
    id: client.id,
    name: formatFullName(client.nom, client.prenom),
    status: mapStatutIdToStatus(client.statutId, mapStatusFn),
    location,
    memberSince: new Date(client.createdAt).getFullYear().toString(),
    info: {
      name: formatFullName(client.nom, client.prenom),
      profession: client.profession || "Non renseigné",
      phone: client.telephone || "Non renseigné",
      birthDate: formatDateFr(client.dateNaissance) || "Non renseigné",
      email: client.email || "Non renseigné",
      address,
    },
    compliance: {
      kycStatus: client.kycStatus || "Non renseigné",
      kycStatusVariant: getKycVariant(client.kycStatus),
      gdprConsent: client.gdprConsent
        ? `Acceptés le ${formatDateFr(client.gdprConsentDate)}`
        : "Non acceptés",
      gdprConsentVariant: client.gdprConsent ? "success" : "error",
      language: client.langue || "Français",
    },
    bank: {
      iban: formatIbanMasked(client.iban),
      sepaMandateStatus: client.mandatSepa ? "Actif" : "Inactif",
      sepaMandateStatusVariant: client.mandatSepa ? "success" : "error",
    },
    contracts: client.contrats || [],
    payments: [],
    documents: [],
    events: [],
    balance: "0.00 EUR",
    balanceStatus: "À jour",
  }
}

export function useClients(filters?: ClientFilters) {
  const [clients, setClients] = useState<ClientRow[]>([])
  const { loading, error, execute } = useApi<ClientBaseDto[]>()
  const { mapToStatus, loading: statutsLoading } = useStatutClients()

  const fetchClients = useCallback(async () => {
    try {
      // Construire les query params
      const params = new URLSearchParams()
      if (filters?.organisationId) {
        params.append("organisationId", filters.organisationId)
      }
      if (filters?.statutId) {
        params.append("statutId", filters.statutId)
      }
      if (filters?.societeId) {
        params.append("societeId", filters.societeId)
      }

      const queryString = params.toString()
      const endpoint = queryString ? `/clientbases?${queryString}` : "/clientbases"

      const data = await execute(() => api.get(endpoint))
      if (data) {
        setClients(data.map(c => mapClientBaseToRow(c, mapToStatus)))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.organisationId, filters?.statutId, filters?.societeId, mapToStatus])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading: loading || statutsLoading,
    error,
    refetch: fetchClients,
  }
}

// Hook pour récupérer un client par son ID avec tous ses détails
export function useClient(clientId: string | null) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { mapToStatus, loading: statutsLoading } = useStatutClients()

  const fetchClient = useCallback(async () => {
    if (!clientId) return

    setLoading(true)
    setError(null)

    try {
      // Récupérer les données du client
      const clientData: ClientDetailDto = await api.get(`/clientbases/${clientId}`)

      if (clientData) {
        const mappedClient = mapClientDetailDtoToDetail(clientData, mapToStatus)

        // NOTE: Les endpoints /paiements, /documents, /evenements ne sont pas encore
        // implémentés côté backend. Ces données seront disponibles quand le backend
        // aura ajouté ces routes ou les inclura dans la réponse principale.
        // Pour l'instant, on retourne des tableaux vides.
        const paymentsData: PaiementDto[] = []
        const documentsData: DocumentDto[] = []
        const eventsData: EvenementDto[] = []

        // Mettre à jour le client avec les données associées
        setClient({
          ...mappedClient,
          payments: paymentsData || [],
          documents: documentsData || [],
          events: eventsData || [],
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement du client"))
    } finally {
      setLoading(false)
    }
  }, [clientId, mapToStatus])

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId, fetchClient])

  return {
    client,
    loading: loading || statutsLoading,
    error,
    refetch: fetchClient,
  }
}

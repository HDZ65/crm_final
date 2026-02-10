"use client"

import { useCallback, useEffect, useState } from "react"
import { getClientsByOrganisation, getClient, updateClient } from "@/actions/clients"
import { getContratsByOrganisation } from "@/actions/contrats"
import {
  formatCreatedAgo,
  formatDateFr,
  formatAddress,
  formatLocation,
  formatIbanMasked,
  getKycVariant,
  formatFullName,
} from "@/lib/formatters"
import type {
  ClientFilters,
  ClientRow,
  ClientDetail,
  ClientStatus,
  PaiementDto,
  DocumentDto,
  EvenementDto,
} from "@/lib/ui/display-types/client"
import type { ClientBase, Adresse } from "@proto/clients/clients"
import type { ContratSimpleDto } from "@/lib/ui/display-types/contract"
import type { Contrat } from "@proto/contrats/contrats"

// DEPRECATED: Ces constantes sont conservées pour compatibilité temporaire
// Utilisez useStatutClients().getByCode('actif') à la place
/** @deprecated Utilisez useStatutClients() à la place */
export const STATUT_IDS = {} as Record<string, string>
/** @deprecated Utilisez useStatutClients().mapToStatus() à la place */
export const STATUT_LABELS: Record<string, ClientStatus> = {}

// Re-export des types pour compatibilité avec les imports existants
export type {
  ClientFilters,
  ClientRow,
  ClientDetail,
  ClientStatus,
  PaiementDto,
  DocumentDto,
  EvenementDto,
} from "@/lib/ui/display-types/client"

export type { ContratSimpleDto as ContratDto } from "@/lib/ui/display-types/contract"

// Map statut string to ClientStatus
function mapStatutToStatus(statut: string): ClientStatus {
  const lower = statut.toLowerCase()
  if (lower === "impaye" || lower === "impayé") return "Impaye"
  if (lower === "suspendu") return "Suspendu"
  return "Actif"
}

// Map contrats gRPC to ContratSimpleDto
function mapContratToSimple(c: Contrat): ContratSimpleDto {
  return {
    id: c.id,
    referenceExterne: c.reference,
    statutId: c.statut,
    dateDebut: c.dateDebut,
    dateFin: c.dateFin || "",
    societeId: c.societeId || undefined,
  }
}

function mapClientBaseToRow(
  client: ClientBase,
  contrats: Contrat[] = []
): ClientRow {
  // Extraire les societeIds uniques des contrats
  const societeIds = [
    ...new Set(
      contrats
        .filter(c => c.clientId === client.id)
        .map((c) => c.societeId)
        .filter((id): id is string => !!id)
    ),
  ]

  return {
    id: client.id,
    name: formatFullName(client.nom, client.prenom),
    status: mapStatutToStatus(client.statut),
    contracts: contrats
      .filter(c => c.clientId === client.id)
      .map((c) => c.reference),
    createdAgo: formatCreatedAgo(client.createdAt),
    email: client.email,
    phone: client.telephone,
    societeIds,
  }
}

function mapClientDetailDtoToDetail(
  client: ClientBase,
  contrats: Contrat[] = []
): ClientDetail {
  // Récupérer l'adresse principale (première adresse ou adresse de type 'principal')
  const primaryAddress = client.adresses?.find((a: Adresse) => a.type === 'principal') || client.adresses?.[0]

  const address = primaryAddress
    ? formatAddress(primaryAddress)
    : "Non renseigné"

  const location = primaryAddress
    ? formatLocation(primaryAddress)
    : "Non renseigné"

  // Mapper les contrats de ce client
  const clientContrats = contrats.filter(c => c.clientId === client.id).map(mapContratToSimple)

  return {
    id: client.id,
    name: formatFullName(client.nom, client.prenom),
    status: mapStatutToStatus(client.statut),
    location,
    memberSince: new Date(client.createdAt).getFullYear().toString(),
    info: {
      nom: client.nom || "Non renseigné",
      prenom: client.prenom || "Non renseigné",
      profession: "Non renseigné", // Not available in gRPC yet
      phone: client.telephone || "Non renseigné",
      birthDate: formatDateFr(client.dateNaissance) || "Non renseigné",
      email: client.email || "Non renseigné",
      address,
    },
    compliance: {
      kycStatus: "Non renseigné", // Not available in gRPC yet
      kycStatusVariant: getKycVariant(undefined),
      gdprConsent: "Non acceptés", // Not available in gRPC yet
      gdprConsentVariant: "error",
      language: "Français",
    },
    bank: {
      iban: formatIbanMasked(undefined),
      sepaMandateStatus: "Inactif", // Not available in gRPC yet
      sepaMandateStatusVariant: "error",
    },
    contracts: clientContrats,
    payments: [],
    documents: [],
    events: [],
    balance: "0.00 EUR",
    balanceStatus: "À jour",
  }
}

export function useClients(filters?: ClientFilters) {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    if (!filters?.organisationId) {
      setClients([])
      return
    }

    setError(null)

    try {
      console.log("[useClients] Fetching with filters:", filters)

      // Fetch clients and contrats in parallel
      const [clientsResult, contratsResult] = await Promise.all([
        getClientsByOrganisation({
          organisationId: filters.organisationId,
          statutId: filters.statutId,
          societeId: filters.societeId,
        }),
        getContratsByOrganisation({
          organisationId: filters.organisationId,
          societeId: filters.societeId,
        }),
      ])

      if (clientsResult.error) {
        setError(clientsResult.error)
        return
      }

      const clientsData = clientsResult.data?.clients || []
      const contratsData = contratsResult.data?.contrats || []

      console.log("[useClients] Response:", clientsData.length, "clients,", contratsData.length, "contrats")

      setClients(clientsData.map(c => mapClientBaseToRow(c, contratsData)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des clients")
    }
  }, [filters?.organisationId, filters?.statutId, filters?.societeId])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    error,
    refetch: fetchClients,
  }
}

// Hook pour récupérer un client par son ID avec tous ses détails
export function useClient(clientId: string | null) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetchClient = useCallback(async () => {
    if (!clientId) return

    setError(null)

    try {
      // Fetch client data
      const clientResult = await getClient(clientId)

      if (clientResult.error) {
        setError(new Error(clientResult.error))
        return
      }

      if (!clientResult.data) {
        setError(new Error("Client non trouvé"))
        return
      }

      const clientData = clientResult.data

      // Fetch contrats for this client
      const contratsResult = await getContratsByOrganisation({
        organisationId: clientData.organisationId,
        clientId: clientId,
      })

      const contratsData = contratsResult.data?.contrats || []

      const mappedClient = mapClientDetailDtoToDetail(clientData, contratsData)

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
        payments: paymentsData,
        documents: documentsData,
        events: eventsData,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement du client"))
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId, fetchClient])

  return {
    client,
    error,
    refetch: fetchClient,
  }
}

// Hook pour mettre à jour un client
export function useUpdateClient(clientId: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateField = useCallback(async (field: string, value: string) => {
    if (!clientId) return

    setLoading(true)
    setError(null)

    try {
      const result = await updateClient({ id: clientId, [field]: value })
      if (result.error) {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Erreur lors de la mise à jour")
      setError(errorObj)
      throw errorObj
    } finally {
      setLoading(false)
    }
  }, [clientId])

  return {
    updateField,
    loading,
    error,
  }
}

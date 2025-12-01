"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

// IDs des statuts côté API
export const STATUT_IDS = {
  ACTIF: "e620365e-c045-4122-9e1c-17f651f82135",
  SUSPENDU: "69f10297-1924-49f0-9da7-34dcec3363ed",
  IMPAYE: "a83f7ff0-38a2-4217-97e8-fd6420a3aca6",
} as const

// Mapping statut ID -> label affiché
export const STATUT_LABELS: Record<string, "Actif" | "Impayé" | "Suspendu"> = {
  [STATUT_IDS.ACTIF]: "Actif",
  [STATUT_IDS.IMPAYE]: "Impayé",
  [STATUT_IDS.SUSPENDU]: "Suspendu",
}

export interface ClientFilters {
  statutId?: string
  societeId?: string
}

export interface ContratDto {
  id: string
  referenceExterne: string
  dateDebut: string
  dateFin: string
  statutId: string
  groupeId: string | null
}

export interface ClientBaseDto {
  id: string
  organisationId: string
  typeClient: string
  nom: string
  prenom: string
  telephone: string
  email?: string
  statutId: string
  createdAt: string
  updatedAt: string
  contrats: ContratDto[]
}

export interface ClientRow {
  id: string
  name: string
  status: "Actif" | "Impayé" | "Suspendu"
  contracts: string[]
  createdAgo: string
  email?: string
  phone?: string
  societeIds: string[]
}

function formatCreatedAgo(dateString?: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return "Créé aujourd'hui"
  if (diffDays === 1) return "Créé hier"
  if (diffDays < 7) return `Créé il y a ${diffDays} jours`
  if (diffDays < 30) return `Créé il y a ${Math.floor(diffDays / 7)} semaine(s)`
  if (diffDays < 365) return `Créé il y a ${Math.floor(diffDays / 30)} mois`
  return `Créé il y a ${Math.floor(diffDays / 365)} an(s)`
}

function mapStatutIdToStatus(statutId: string): "Actif" | "Impayé" | "Suspendu" {
  return STATUT_LABELS[statutId] || "Actif"
}

function mapClientBaseToRow(client: ClientBaseDto): ClientRow {
  // Extraire les groupeIds uniques des contrats (correspond aux sociétés)
  const societeIds = [
    ...new Set(
      client.contrats
        ?.map((c) => c.groupeId)
        .filter((id): id is string => id !== null) || []
    ),
  ]

  return {
    id: client.id,
    name: `${client.nom} ${client.prenom}`.trim(),
    status: mapStatutIdToStatus(client.statutId),
    contracts: client.contrats?.map((c) => c.referenceExterne) || [],
    createdAgo: formatCreatedAgo(client.createdAt),
    email: client.email,
    phone: client.telephone,
    societeIds,
  }
}

// DTO complet pour un client avec tous ses détails
export interface ClientDetailDto extends ClientBaseDto {
  adresse?: string
  ville?: string
  codePostal?: string
  pays?: string
  dateNaissance?: string
  profession?: string
  iban?: string
  mandatSepa?: boolean
  kycStatus?: string
  gdprConsent?: boolean
  gdprConsentDate?: string
  langue?: string
}

// Type pour les paiements
export interface PaiementDto {
  id: string
  contratId: string
  montant: number
  devise: string
  datePaiement: string
  statut: string
  reference: string
}

// Type pour les documents
export interface DocumentDto {
  id: string
  clientId: string
  nom: string
  type: string
  dateUpload: string
  url?: string
}

// Type pour l'historique d'événements
export interface EvenementDto {
  id: string
  contratId?: string
  clientId: string
  type: string
  description: string
  date: string
}

// Interface pour les données complètes d'un client
export interface ClientDetail {
  id: string
  name: string
  status: "Actif" | "Impayé" | "Suspendu"
  location: string
  memberSince: string
  info: {
    name: string
    profession: string
    phone: string
    birthDate: string
    email: string
    address: string
  }
  compliance: {
    kycStatus: string
    kycStatusVariant: "success" | "warning" | "error"
    gdprConsent: string
    gdprConsentVariant: "success" | "warning" | "error"
    language: string
  }
  bank: {
    iban: string
    sepaMandateStatus: string
    sepaMandateStatusVariant: "success" | "warning" | "error"
  }
  contracts: ContratDto[]
  payments: PaiementDto[]
  documents: DocumentDto[]
  events: EvenementDto[]
  balance: string
  balanceStatus: string
}

function formatDate(dateString?: string): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR")
}

function getKycVariant(status?: string): "success" | "warning" | "error" {
  if (!status) return "error"
  const normalized = status.toLowerCase()
  if (normalized === "validé" || normalized === "valide" || normalized === "complet") return "success"
  if (normalized === "en cours" || normalized === "partiel") return "warning"
  return "error"
}

function mapClientDetailDtoToDetail(client: ClientDetailDto): ClientDetail {
  const address = [client.adresse, client.codePostal, client.ville, client.pays]
    .filter(Boolean)
    .join(", ")

  const location = [client.ville, client.pays].filter(Boolean).join(", ") || "Non renseigné"

  return {
    id: client.id,
    name: `${client.nom} ${client.prenom}`.trim(),
    status: mapStatutIdToStatus(client.statutId),
    location,
    memberSince: new Date(client.createdAt).getFullYear().toString(),
    info: {
      name: `${client.nom} ${client.prenom}`.trim(),
      profession: client.profession || "Non renseigné",
      phone: client.telephone || "Non renseigné",
      birthDate: formatDate(client.dateNaissance) || "Non renseigné",
      email: client.email || "Non renseigné",
      address: address || "Non renseigné",
    },
    compliance: {
      kycStatus: client.kycStatus || "Non renseigné",
      kycStatusVariant: getKycVariant(client.kycStatus),
      gdprConsent: client.gdprConsent
        ? `Acceptés le ${formatDate(client.gdprConsentDate)}`
        : "Non acceptés",
      gdprConsentVariant: client.gdprConsent ? "success" : "error",
      language: client.langue || "Français",
    },
    bank: {
      iban: client.iban
        ? `${client.iban.substring(0, 4)} **** **** **** **** **** ${client.iban.slice(-4)}`
        : "Non renseigné",
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

  const fetchClients = useCallback(async () => {
    try {
      // Construire les query params
      const params = new URLSearchParams()
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
        setClients(data.map(mapClientBaseToRow))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.statutId, filters?.societeId])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
  }
}

// Hook pour récupérer un client par son ID avec tous ses détails
export function useClient(clientId: string | null) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchClient = useCallback(async () => {
    if (!clientId) return

    setLoading(true)
    setError(null)

    try {
      // Récupérer les données du client
      const clientData: ClientDetailDto = await api.get(`/clientbases/${clientId}`)

      if (clientData) {
        const mappedClient = mapClientDetailDtoToDetail(clientData)

        // Lancer les appels en parallèle pour les données associées
        const [paymentsData, documentsData, eventsData] = await Promise.all([
          api.get(`/clientbases/${clientId}/paiements`).catch(() => []),
          api.get(`/clientbases/${clientId}/documents`).catch(() => []),
          api.get(`/clientbases/${clientId}/evenements`).catch(() => []),
        ])

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
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId, fetchClient])

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
  }
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import { useStatutClients } from "./use-statut-clients"

// DEPRECATED: Ces constantes sont conservées pour compatibilité temporaire
// Utilisez useStatutClients().getByCode('actif') à la place
/** @deprecated Utilisez useStatutClients() à la place */
export const STATUT_IDS = {} as Record<string, string>
/** @deprecated Utilisez useStatutClients().mapToStatus() à la place */
export const STATUT_LABELS: Record<string, "Actif" | "Impayé" | "Suspendu"> = {}

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

// Note: Cette fonction est maintenant une version de compatibilité
// Le vrai mapping se fait via useStatutClients().mapToStatus()
function mapStatutIdToStatus(statutId: string, mapFn?: (id: string) => "Actif" | "Impayé" | "Suspendu"): "Actif" | "Impayé" | "Suspendu" {
  if (mapFn) return mapFn(statutId)
  // Fallback pour compatibilité - ne devrait plus être utilisé
  return "Actif"
}

function mapClientBaseToRow(
  client: ClientBaseDto,
  mapStatusFn?: (id: string) => "Actif" | "Impayé" | "Suspendu"
): ClientRow {
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
    status: mapStatutIdToStatus(client.statutId, mapStatusFn),
    contracts: client.contrats?.map((c) => c.referenceExterne) || [],
    createdAgo: formatCreatedAgo(client.createdAt),
    email: client.email,
    phone: client.telephone,
    societeIds,
  }
}

// DTO d'adresse (correspond au backend)
export interface AdresseDto {
  id: string
  ligne1: string
  ligne2?: string
  codePostal: string
  ville: string
  pays: string
  type?: string
  clientId?: string
}

// DTO complet pour un client avec tous ses détails
// Note: Les champs comme adresse, profession, iban etc. ne sont pas encore
// implémentés côté backend. Ils seront ajoutés via des relations ou extensions futures.
export interface ClientDetailDto extends ClientBaseDto {
  // Champs existants en backend
  dateNaissance?: string
  compteCode?: string
  partenaireId?: string
  dateCreation?: string
  // Relation adresses
  adresses?: AdresseDto[]
  // Champs à implémenter côté backend (optionnels pour compatibilité UI)
  // Ces champs seront ajoutés progressivement quand le backend les supportera
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

function mapClientDetailDtoToDetail(
  client: ClientDetailDto,
  mapStatusFn?: (id: string) => "Actif" | "Impayé" | "Suspendu"
): ClientDetail {
  // Récupérer l'adresse principale (première adresse ou adresse de type 'principal')
  const primaryAddress = client.adresses?.find(a => a.type === 'principal') || client.adresses?.[0]

  const address = primaryAddress
    ? [primaryAddress.ligne1, primaryAddress.ligne2, primaryAddress.codePostal, primaryAddress.ville, primaryAddress.pays]
        .filter(Boolean)
        .join(", ")
    : "Non renseigné"

  const location = primaryAddress
    ? [primaryAddress.ville, primaryAddress.pays].filter(Boolean).join(", ")
    : "Non renseigné"

  return {
    id: client.id,
    name: `${client.nom} ${client.prenom}`.trim(),
    status: mapStatutIdToStatus(client.statutId, mapStatusFn),
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
  const { mapToStatus, loading: statutsLoading } = useStatutClients()

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
        setClients(data.map(c => mapClientBaseToRow(c, mapToStatus)))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute, filters?.statutId, filters?.societeId, mapToStatus])

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

        // Lancer les appels en parallèle pour les données associées
        const [paymentsData, documentsData, eventsData] = await Promise.all([
          api.get<PaiementDto[]>(`/clientbases/${clientId}/paiements`).catch(() => [] as PaiementDto[]),
          api.get<DocumentDto[]>(`/clientbases/${clientId}/documents`).catch(() => [] as DocumentDto[]),
          api.get<EvenementDto[]>(`/clientbases/${clientId}/evenements`).catch(() => [] as EvenementDto[]),
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

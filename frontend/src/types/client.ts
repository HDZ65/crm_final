/**
 * Types pour les clients
 */

import type { ContratSimpleDto, Contract, ContractEvent } from "./contract"

// Re-export des types de contrat pour compatibilité
export type { Contract, ContractEvent } from "./contract"

// ============================================
// Types locaux (correspondant aux types gRPC)
// Ces types évitent d'importer directement depuis @/generated/grpc/*
// ce qui causerait des erreurs de bundling côté client
// ============================================

/**
 * Type Adresse local (équivalent au type gRPC Adresse)
 */
export interface Adresse {
  id: string
  clientBaseId: string
  ligne1: string
  ligne2: string
  codePostal: string
  ville: string
  pays: string
  type: string
  createdAt: string
  updatedAt: string
}

/**
 * Type ClientBase local (équivalent au type gRPC ClientBase)
 */
export interface ClientBase {
  id: string
  organisationId: string
  typeClient: string
  nom: string
  prenom: string
  dateNaissance: string
  compteCode: string
  partenaireId: string
  dateCreation: string
  telephone: string
  email: string
  statut: string
  createdAt: string
  updatedAt: string
  adresses: Adresse[]
}

// ============================================
// DTOs (correspondant au backend)
// ============================================

// Filtres pour la recherche de clients
export interface ClientFilters {
  organisationId?: string
  statutId?: string
  societeId?: string
}

// Adresse DTO (version simplifiée pour l'UI)
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

// Client de base (depuis le backend)
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
  contrats: ContratSimpleDto[]
}

// Client avec détails complets
export interface ClientDetailDto extends ClientBaseDto {
  // Champs existants en backend
  dateNaissance?: string
  compteCode?: string
  partenaireId?: string
  dateCreation?: string
  // Relation adresses
  adresses?: AdresseDto[]
  // Champs optionnels (à implémenter côté backend)
  profession?: string
  iban?: string
  mandatSepa?: boolean
  kycStatus?: string
  gdprConsent?: boolean
  gdprConsentDate?: string
  langue?: string
}

// ============================================
// Types pour l'affichage (mappés)
// ============================================

// Statut client pour l'UI
export type ClientStatus = "Actif" | "Impayé" | "Suspendu"

// Client pour les listes
export interface ClientRow {
  id: string
  name: string
  status: ClientStatus
  contracts: string[]
  createdAgo: string
  email?: string
  phone?: string
  societeIds: string[]
}

// Informations personnelles du client
export interface ClientInfo {
  nom: string
  prenom: string
  profession: string
  phone: string
  birthDate: string
  email: string
  address: string
}

// Informations de conformité
export interface ComplianceInfo {
  kycStatus: string
  kycStatusVariant: "success" | "warning" | "error"
  gdprConsent: string
  gdprConsentVariant: "success" | "warning" | "error"
  language: string
}

// Informations bancaires
export interface BankInfo {
  iban: string
  sepaMandateStatus: string
  sepaMandateStatusVariant: "success" | "warning" | "error"
}

// Client complet pour l'affichage détaillé
export interface ClientDetail {
  id: string
  name: string
  status: ClientStatus
  location: string
  memberSince: string
  info: ClientInfo
  compliance: ComplianceInfo
  bank: BankInfo
  contracts: ContratSimpleDto[]
  payments: PaiementDto[]
  documents: DocumentDto[]
  events: EvenementDto[]
  balance: string
  balanceStatus: string
}

// ============================================
// Types associés
// ============================================

// Paiement
export interface PaiementDto {
  id: string
  contratId: string
  montant: number
  devise: string
  datePaiement: string
  statut: string
  reference: string
}

// Document
export interface DocumentDto {
  id: string
  clientId: string
  nom: string
  type: string
  dateUpload: string
  url?: string
}

// Événement historique
export interface EvenementDto {
  id: string
  contratId?: string
  clientId: string
  type: string
  description: string
  date: string
}

// ============================================
// Types pour l'affichage UI (simplifiés)
// ============================================

// Événement pour la timeline/historique
export interface EventItem {
  icon?: React.ElementType
  label: string
  date: string
  ref?: string
  description?: string
}

// Paiement pour l'affichage
export interface Payment {
  label: string
  date: string
  amount: string
  status: string
}

// Document pour l'affichage
export interface Document {
  name: string
  type: string
  updated: string
  url?: string
}

// ============================================
// Types pour le suivi d'expédition
// ============================================

export type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"

export interface ShipmentEvent {
  date: string
  status: string
  location?: string
  description: string
}

export interface Shipment {
  id: string
  trackingNumber: string
  status: ShipmentStatus
  recipientName: string
  recipientAddress: string
  senderName?: string
  senderAddress?: string
  product: string
  weight?: number
  createdAt: string
  estimatedDelivery?: string
  deliveredAt?: string
  events: ShipmentEvent[]
  contractRef?: string
}

import type { LucideIcon } from "lucide-react"

export interface EventItem {
  icon: LucideIcon
  label: string
  date: string
  ref?: string
}

export interface Contract {
  ref: string
  product: string
  status: string
  start: string
  pay: string
  sales: string
  history: EventItem[]
}

export interface Payment {
  label: string
  date: string
  amount: string
  status: string
}

export interface Document {
  name: string
  type: string
  updated: string
}

export interface ClientInfo {
  name: string
  profession: string
  phone: string
  birthDate: string
  email: string
  address: string
}

export interface ComplianceInfo {
  kycStatus: string
  kycStatusVariant: "success" | "warning" | "error"
  gdprConsent: string
  gdprConsentVariant: "success" | "warning" | "error"
  language: string
}

export interface BankInfo {
  iban: string
  sepaMandateStatus: string
  sepaMandateStatusVariant: "success" | "warning" | "error"
}

export interface Client {
  id: string
  name: string
  status: string
  location: string
  memberSince: string
  info: ClientInfo
  compliance: ComplianceInfo
  bank: BankInfo
  contracts: Contract[]
  payments: Payment[]
  documents: Document[]
  balance: string
  balanceStatus: string
}

// Shipment tracking types (La Poste API)
export type ShipmentStatus =
  | "pending" // En attente d'expédition
  | "in_transit" // En cours d'acheminement
  | "out_for_delivery" // En cours de livraison
  | "delivered" // Livré
  | "failed" // Échec de livraison
  | "returned" // Retourné

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
  product: string // Type de produit La Poste (Colissimo, Chronopost, etc.)
  weight?: number
  createdAt: string
  estimatedDelivery?: string
  deliveredAt?: string
  events: ShipmentEvent[]
  contractRef?: string // Lien avec un contrat si applicable
}

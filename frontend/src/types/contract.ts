/**
 * Types pour les contrats et données de référence associées
 */

// ============================================
// Types locaux (correspondant aux types gRPC)
// Ces types évitent d'importer directement depuis @/generated/grpc/*
// ce qui causerait des erreurs de bundling côté client
// ============================================

/**
 * Type Contrat local (équivalent au type gRPC Contrat)
 * Utilisé dans les hooks client-side
 */
export interface Contrat {
  id: string
  organisationId: string
  reference: string
  titre: string
  description: string
  type: string
  statut: string
  dateDebut: string
  dateFin: string
  dateSignature: string
  montant: number
  devise: string
  frequenceFacturation: string
  documentUrl: string
  fournisseur: string
  clientId: string
  commercialId: string
  societeId: string
  notes: string
  createdAt: string
  updatedAt: string
}

// ============================================
// DTOs (correspondant au backend)
// ============================================

// Condition de paiement
export interface ConditionPaiementDto {
  id: string
  code: string
  nom: string
  description?: string
  delaiJours?: number
  createdAt?: string
  updatedAt?: string
}

// Modèle de distribution
export interface ModeleDistributionDto {
  id: string
  code: string
  nom: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

// Statut de contrat
export interface StatutContratDto {
  id: string
  code: string
  nom: string
  description?: string
  ordreAffichage?: number
  createdAt?: string
  updatedAt?: string
}

// Partenaire (marque blanche)
export interface PartenaireDto {
  id: string
  nom: string
  code?: string
  type?: string
  actif?: boolean
  createdAt?: string
  updatedAt?: string
}

// Facturation par (période de facturation)
export interface FacturationParDto {
  id: string
  code: string
  nom: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

// Contrat DTO (depuis le backend)
export interface ContratDto {
  id: string
  organisationId: string
  referenceExterne: string
  dateSignature: string
  dateDebut: string
  dateFin: string
  statutId: string
  autoRenouvellement: boolean
  joursPreavis: number
  conditionPaiementId: string
  modeleDistributionId: string
  facturationParId: string
  clientBaseId: string
  societeId: string
  commercialId: string
  clientPartenaireId: string
  adresseFacturationId: string
  dateFinRetractation: string
  createdAt: string
  updatedAt: string
}

// Contrat simplifié pour les listes
export interface ContratSimpleDto {
  id: string
  referenceExterne: string
  dateDebut: string
  dateFin: string
  statutId: string
  societeId?: string
}

// Contrat pour l'affichage (mappé)
export interface Contract {
  ref: string
  product: string
  status: string
  start: string
  pay: string
  sales: string
  history: ContractEvent[]
}

// Événement de contrat
export interface ContractEvent {
  icon?: React.ElementType
  label: string
  date: string
  ref?: string
}

// DTO pour créer un contrat
export interface CreateContratDto {
  organisationId: string
  referenceExterne: string
  dateSignature: string
  dateDebut: string
  dateFin: string
  statutId: string
  autoRenouvellement: boolean
  joursPreavis: number
  conditionPaiementId: string
  modeleDistributionId: string
  facturationParId: string
  clientBaseId: string
  societeId: string
  commercialId: string
  clientPartenaireId: string
  adresseFacturationId: string
  dateFinRetractation: string
}

// DTO pour mettre à jour un contrat
export interface UpdateContratDto {
  referenceExterne?: string
  dateSignature?: string
  dateDebut?: string
  dateFin?: string
  statutId?: string
  autoRenouvellement?: boolean
  joursPreavis?: number
  conditionPaiementId?: string
  modeleDistributionId?: string
  facturationParId?: string
  adresseFacturationId?: string
  dateFinRetractation?: string
}

// Types pour les factures

export interface Facture {
  id: string
  organisationId: string
  numero: string
  dateEmission: string
  montantHT: number
  montantTTC: number
  statutId: string
  emissionFactureId: string
  clientBaseId: string
  contratId?: string | null
  clientPartenaireId: string
  adresseFacturationId: string
  createdAt: string
  updatedAt: string
  // Relations (optionnelles, si populées)
  client?: {
    id: string
    nom: string
    prenom: string
  }
  statut?: StatutFacture
}

export interface StatutFacture {
  id: string
  code: string
  nom: string
  description?: string
  ordreAffichage: number
}

export interface FactureFilters {
  organisationId?: string
  clientBaseId?: string
  statutId?: string
  dateDebut?: string
  dateFin?: string
}

export const STATUT_FACTURE_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  emise: "Émise",
  envoyee: "Envoyée",
  payee: "Payée",
  partiellement_payee: "Partiellement payée",
  en_retard: "En retard",
  annulee: "Annulée",
}

export const STATUT_FACTURE_COLORS: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-800",
  emise: "bg-blue-100 text-blue-800",
  envoyee: "bg-purple-100 text-purple-800",
  payee: "bg-green-100 text-green-800",
  partiellement_payee: "bg-yellow-100 text-yellow-800",
  en_retard: "bg-red-100 text-red-800",
  annulee: "bg-gray-100 text-gray-500",
}

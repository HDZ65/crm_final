export type PartnerStatus = "Actif" | "Impayé" | "Prospect"

export interface Partner {
  id: string
  name: string
  status: PartnerStatus
  email: string
  siren: string
}

export interface PartnerFilters {
  name?: string
  siren?: string
  email?: string
  phone?: string
  company?: string
  product?: string
}

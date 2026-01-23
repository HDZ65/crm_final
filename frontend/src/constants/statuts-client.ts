export const STATUTS_CLIENT = [
  { id: "actif", code: "actif", nom: "Actif" },
  { id: "impaye", code: "impaye", nom: "Impayé" },
  { id: "suspendu", code: "suspendu", nom: "Suspendu" },
] as const

export type StatutClient = (typeof STATUTS_CLIENT)[number]
export type StatutClientCode = StatutClient["code"]

export const DEFAULT_STATUT_CODE: StatutClientCode = "actif"

export function getStatutByCode(code: string): StatutClient | undefined {
  return STATUTS_CLIENT.find((s) => s.code === code)
}

export function getDefaultStatut(): StatutClient {
  return STATUTS_CLIENT.find((s) => s.code === DEFAULT_STATUT_CODE)!
}

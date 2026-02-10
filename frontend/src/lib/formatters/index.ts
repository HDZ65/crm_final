/**
 * Fonctions utilitaires de formatage et transformation
 */

import type { ClientStatus } from "@/lib/ui/display-types/client"

export function formatCreatedAgo(dateString?: string): string {
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

export function formatDateFr(dateString?: string): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR")
}

export function formatDateLongFr(dateString?: string): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function getKycVariant(status?: string): "success" | "warning" | "error" {
  if (!status) return "error"
  const normalized = status.toLowerCase()
  if (
    normalized === "validé" ||
    normalized === "valide" ||
    normalized === "complet"
  )
    return "success"
  if (normalized === "en cours" || normalized === "partiel") return "warning"
  return "error"
}

export function formatIbanMasked(iban?: string): string {
  if (!iban) return "Non renseigné"
  return `${iban.substring(0, 4)} **** **** **** **** ${iban.slice(-4)}`
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatAddress(components: {
  ligne1?: string
  ligne2?: string
  codePostal?: string
  ville?: string
  pays?: string
}): string {
  return (
    [
      components.ligne1,
      components.ligne2,
      components.codePostal,
      components.ville,
      components.pays,
    ]
      .filter(Boolean)
      .join(", ") || "Non renseigné"
  )
}

export function formatLocation(components: {
  ville?: string
  pays?: string
}): string {
  return (
    [components.ville, components.pays].filter(Boolean).join(", ") ||
    "Non renseigné"
  )
}

export function mapStatutIdToStatus(
  statutId: string,
  mapFn?: (id: string) => ClientStatus
): ClientStatus {
  if (mapFn) return mapFn(statutId)
  return "Actif"
}

export function formatFullName(nom?: string, prenom?: string): string {
  return [nom, prenom].filter(Boolean).join(" ").trim() || "Non renseigné"
}

export function valueOrDefault(
  value?: string | null,
  defaultValue = "Non renseigné"
): string {
  return value || defaultValue
}

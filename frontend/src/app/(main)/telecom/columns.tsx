"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ProvisioningStateBadge } from "@/components/telecom/provisioning-state-badge"
import type { ProvisioningLifecycle } from "@proto/telecom/telecom"
import { cn } from "@/lib/utils"

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function formatMontant(montant: number, devise: string): string {
  if (!montant && montant !== 0) return "—"
  return `${montant.toFixed(2)} ${devise || "€"}`
}

const ABO_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  ACTIVE: { label: "Actif", className: "bg-green-50 text-green-700 border-green-200" },
  ERROR: { label: "Erreur", className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED: { label: "Annulé", className: "bg-gray-50 text-gray-600 border-gray-200" },
}

function AboBadge({ status }: { status: string }) {
  const config = ABO_STATUS_LABELS[status] ?? { label: status || "—", className: "" }
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}

export const columns: ColumnDef<ProvisioningLifecycle>[] = [
  {
    accessorKey: "contratId",
    header: "N° Contrat",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.contratId || "—"}</span>
    ),
  },
  {
    accessorKey: "clientId",
    header: "Client",
    cell: ({ row }) => row.original.clientId || "—",
  },
  {
    accessorKey: "provisioningState",
    header: "État du cycle",
    cell: ({ row }) => (
      <ProvisioningStateBadge state={row.original.provisioningState} />
    ),
  },
  {
    accessorKey: "abonnementStatus",
    header: "Statut abo.",
    cell: ({ row }) => <AboBadge status={row.original.abonnementStatus} />,
  },
  {
    accessorKey: "montantAbonnement",
    header: "Montant",
    cell: ({ row }) =>
      formatMontant(row.original.montantAbonnement, row.original.devise),
  },
  {
    accessorKey: "dateSignature",
    header: "Signature",
    cell: ({ row }) => formatDate(row.original.dateSignature),
  },
  {
    accessorKey: "dateFinRetractation",
    header: "Fin rétractation",
    cell: ({ row }) => formatDate(row.original.dateFinRetractation),
  },
  {
    accessorKey: "updatedAt",
    header: "Dernière MàJ",
    cell: ({ row }) => formatDate(row.original.updatedAt),
  },
]

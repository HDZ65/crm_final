"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table-basic"
import type { ColumnDef } from "@tanstack/react-table"
import type { AuditLog } from "@proto/commission/commission"
import { AuditAction, AuditScope } from "@/lib/proto-enums"

interface AuditLogViewerProps {
  logs: AuditLog[]
  loading?: boolean
}

const formatDateTime = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const formatCurrency = (amount?: string) => {
  if (!amount) return "—"
  const numberValue = Number(amount)
  if (Number.isNaN(numberValue)) return "—"
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numberValue)
}

const scopeLabels: Record<number, string> = {
  [AuditScope.AUDIT_SCOPE_COMMISSION]: "Commission",
  [AuditScope.AUDIT_SCOPE_RECURRENCE]: "Récurrence",
  [AuditScope.AUDIT_SCOPE_REPRISE]: "Reprise",
  [AuditScope.AUDIT_SCOPE_REPORT]: "Report",
  [AuditScope.AUDIT_SCOPE_BORDEREAU]: "Bordereau",
  [AuditScope.AUDIT_SCOPE_LIGNE]: "Ligne",
  [AuditScope.AUDIT_SCOPE_BAREME]: "Barème",
  [AuditScope.AUDIT_SCOPE_PALIER]: "Palier",
  [AuditScope.AUDIT_SCOPE_ENGINE]: "Moteur",
}

const actionLabels: Record<number, string> = {
  [AuditAction.AUDIT_ACTION_COMMISSION_CALCULATED]: "Calculée",
  [AuditAction.AUDIT_ACTION_COMMISSION_CREATED]: "Créée",
  [AuditAction.AUDIT_ACTION_COMMISSION_UPDATED]: "Mise à jour",
  [AuditAction.AUDIT_ACTION_COMMISSION_DELETED]: "Supprimée",
  [AuditAction.AUDIT_ACTION_COMMISSION_STATUS_CHANGED]: "Statut modifié",
  [AuditAction.AUDIT_ACTION_RECURRENCE_GENERATED]: "Récurrence générée",
  [AuditAction.AUDIT_ACTION_RECURRENCE_STOPPED]: "Récurrence stoppée",
  [AuditAction.AUDIT_ACTION_REPRISE_CREATED]: "Reprise créée",
  [AuditAction.AUDIT_ACTION_REPRISE_APPLIED]: "Reprise appliquée",
  [AuditAction.AUDIT_ACTION_REPRISE_CANCELLED]: "Reprise annulée",
  [AuditAction.AUDIT_ACTION_REPRISE_REGULARIZED]: "Reprise régularisée",
  [AuditAction.AUDIT_ACTION_REPORT_NEGATIF_CREATED]: "Report négatif créé",
  [AuditAction.AUDIT_ACTION_REPORT_NEGATIF_APPLIED]: "Report négatif appliqué",
  [AuditAction.AUDIT_ACTION_REPORT_NEGATIF_CLEARED]: "Report négatif apuré",
  [AuditAction.AUDIT_ACTION_BORDEREAU_CREATED]: "Bordereau créé",
  [AuditAction.AUDIT_ACTION_BORDEREAU_VALIDATED]: "Bordereau validé",
  [AuditAction.AUDIT_ACTION_BORDEREAU_EXPORTED]: "Bordereau exporté",
  [AuditAction.AUDIT_ACTION_BORDEREAU_ARCHIVED]: "Bordereau archivé",
  [AuditAction.AUDIT_ACTION_LIGNE_SELECTED]: "Ligne sélectionnée",
  [AuditAction.AUDIT_ACTION_LIGNE_DESELECTED]: "Ligne désélectionnée",
  [AuditAction.AUDIT_ACTION_LIGNE_VALIDATED]: "Ligne validée",
  [AuditAction.AUDIT_ACTION_LIGNE_REJECTED]: "Ligne rejetée",
  [AuditAction.AUDIT_ACTION_BAREME_CREATED]: "Barème créé",
  [AuditAction.AUDIT_ACTION_BAREME_UPDATED]: "Barème mis à jour",
  [AuditAction.AUDIT_ACTION_BAREME_ACTIVATED]: "Barème activé",
  [AuditAction.AUDIT_ACTION_BAREME_DEACTIVATED]: "Barème désactivé",
  [AuditAction.AUDIT_ACTION_BAREME_VERSION_CREATED]: "Version barème créée",
  [AuditAction.AUDIT_ACTION_PALIER_CREATED]: "Palier créé",
  [AuditAction.AUDIT_ACTION_PALIER_UPDATED]: "Palier mis à jour",
  [AuditAction.AUDIT_ACTION_PALIER_DELETED]: "Palier supprimé",
}

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "scope",
    header: "Scope",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {scopeLabels[row.original.scope] || "—"}
      </Badge>
    ),
    size: 120,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <div className="text-sm">{actionLabels[row.original.action] || "—"}</div>
    ),
    size: 150,
  },
  {
    accessorKey: "refId",
    header: "Référence",
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground max-w-[140px] truncate" title={row.original.refId || ""}>
        {row.original.refId || "—"}
      </div>
    ),
    size: 140,
  },
  {
    accessorKey: "userId",
    header: "Utilisateur",
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground">
        {row.original.userName || row.original.userId || "—"}
      </div>
    ),
    size: 140,
  },
  {
    accessorKey: "periode",
    header: "Période",
    cell: ({ row }) => (
      <div className="text-sm">{row.original.periode || "—"}</div>
    ),
    size: 90,
  },
  {
    accessorKey: "montantCalcule",
    header: "Montant",
    cell: ({ row }) => (
      <div className="text-sm font-medium">{formatCurrency(row.original.montantCalcule)}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "motif",
    header: "Motif",
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground max-w-[180px] truncate" title={row.original.motif || ""}>
        {row.original.motif || "—"}
      </div>
    ),
    size: 180,
  },
]

export function AuditLogViewer({ logs, loading }: AuditLogViewerProps) {
  const rows = React.useMemo(() => logs ?? [], [logs])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des audits...</div>
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      headerClassName="bg-sidebar hover:bg-sidebar"
    />
  )
}

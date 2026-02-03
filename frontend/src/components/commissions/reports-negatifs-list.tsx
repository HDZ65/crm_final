"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table-basic"
import type { ColumnDef } from "@tanstack/react-table"
import type { ReportNegatif } from "@proto/commission/commission"
import { StatutReport } from "@/lib/proto/enums"

interface ReportsNegatifsListProps {
  reports: ReportNegatif[]
  loading?: boolean
}

const formatCurrency = (amount?: string) => {
  if (!amount) return "—"
  const numberValue = Number(amount)
  if (Number.isNaN(numberValue)) return "—"
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numberValue)
}

const statutLabels: Record<number, { label: string; className: string }> = {
  [StatutReport.STATUT_REPORT_EN_COURS]: {
    label: "En cours",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  [StatutReport.STATUT_REPORT_APURE]: {
    label: "Apuré",
    className: "bg-success/10 text-success border-success/20",
  },
  [StatutReport.STATUT_REPORT_ANNULE]: {
    label: "Annulé",
    className: "bg-muted text-muted-foreground border-muted",
  },
}

const columns: ColumnDef<ReportNegatif>[] = [
  {
    accessorKey: "apporteurId",
    header: "Apporteur",
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground max-w-[140px] truncate" title={row.original.apporteurId}>
        {row.original.apporteurId}
      </div>
    ),
    size: 140,
  },
  {
    accessorKey: "periodeOrigine",
    header: "Période origine",
    cell: ({ row }) => <div className="text-sm">{row.original.periodeOrigine}</div>,
    size: 120,
  },
  {
    accessorKey: "montantInitial",
    header: "Montant initial",
    cell: ({ row }) => <div className="text-sm">{formatCurrency(row.original.montantInitial)}</div>,
    size: 120,
  },
  {
    accessorKey: "montantRestant",
    header: "Restant",
    cell: ({ row }) => <div className="text-sm font-medium">{formatCurrency(row.original.montantRestant)}</div>,
    size: 120,
  },
  {
    accessorKey: "statutReport",
    header: "Statut",
    cell: ({ row }) => {
      const variant = statutLabels[row.original.statutReport]
      return (
        <Badge variant="outline" className={variant?.className || ""}>
          {variant?.label || "—"}
        </Badge>
      )
    },
    size: 110,
  },
  {
    accessorKey: "dernierePeriodeApplication",
    header: "Dernière application",
    cell: ({ row }) => <div className="text-sm">{row.original.dernierePeriodeApplication || "—"}</div>,
    size: 140,
  },
  {
    accessorKey: "motif",
    header: "Motif",
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground max-w-[180px] truncate" title={row.original.motif || ""}>
        {row.original.motif || "—"}
      </div>
    ),
    size: 160,
  },
]

export function ReportsNegatifsList({ reports, loading }: ReportsNegatifsListProps) {
  const rows = React.useMemo(() => reports ?? [], [reports])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des reports négatifs...</div>
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      headerClassName="bg-sidebar hover:bg-sidebar"
    />
  )
}

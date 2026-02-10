"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table-basic"
import type { ColumnDef } from "@tanstack/react-table"
import type { RecurrenceCommission } from "@proto/commission/commission"
import { StatutRecurrence } from "@proto/commission/commission"

interface RecurrencesListProps {
  recurrences: RecurrenceCommission[]
  loading?: boolean
}

const formatCurrency = (amount?: string) => {
  if (!amount) return "—"
  const numberValue = Number(amount)
  if (Number.isNaN(numberValue)) return "—"
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numberValue)
}

const formatDate = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

const statutLabels: Record<number, { label: string; className: string }> = {
  [StatutRecurrence.STATUT_RECURRENCE_ACTIVE]: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  [StatutRecurrence.STATUT_RECURRENCE_SUSPENDUE]: {
    label: "Suspendue",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  [StatutRecurrence.STATUT_RECURRENCE_TERMINEE]: {
    label: "Terminée",
    className: "bg-muted text-muted-foreground border-muted",
  },
  [StatutRecurrence.STATUT_RECURRENCE_ANNULEE]: {
    label: "Annulée",
    className: "bg-muted text-muted-foreground border-muted",
  },
}

const columns: ColumnDef<RecurrenceCommission>[] = [
  {
    accessorKey: "periode",
    header: "Période",
    cell: ({ row }) => <div className="text-sm">{row.original.periode}</div>,
    size: 90,
  },
  {
    accessorKey: "numeroMois",
    header: "Mois",
    cell: ({ row }) => <div className="text-sm">{row.original.numeroMois}</div>,
    size: 70,
  },
  {
    accessorKey: "contratId",
    header: "Contrat",
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground max-w-[140px] truncate" title={row.original.contratId}>
        {row.original.contratId}
      </div>
    ),
    size: 140,
  },
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
    accessorKey: "tauxRecurrence",
    header: "Taux",
    cell: ({ row }) => <div className="text-sm">{row.original.tauxRecurrence}%</div>,
    size: 80,
  },
  {
    accessorKey: "montantCalcule",
    header: "Montant",
    cell: ({ row }) => <div className="text-sm font-medium">{formatCurrency(row.original.montantCalcule)}</div>,
    size: 120,
  },
  {
    accessorKey: "statutRecurrence",
    header: "Statut",
    cell: ({ row }) => {
      const variant = statutLabels[row.original.statutRecurrence]
      return (
        <Badge variant="outline" className={variant?.className || ""}>
          {variant?.label || "—"}
        </Badge>
      )
    },
    size: 110,
  },
  {
    accessorKey: "dateEncaissement",
    header: "Encaissement",
    cell: ({ row }) => <div className="text-xs text-muted-foreground">{formatDate(row.original.dateEncaissement)}</div>,
    size: 120,
  },
]

export function RecurrencesList({ recurrences, loading }: RecurrencesListProps) {
  const rows = React.useMemo(() => recurrences ?? [], [recurrences])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des récurrences...</div>
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      headerClassName="bg-sidebar hover:bg-sidebar"
    />
  )
}

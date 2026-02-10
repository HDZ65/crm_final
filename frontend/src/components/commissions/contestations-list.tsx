"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table-basic"
import { ColumnDef } from "@tanstack/react-table"
import { Clock, CheckCircle2, Ban, MessageSquareWarning } from "lucide-react"
import type { ContestationWithDetails } from "@/lib/ui/display-types/commission"
import { ResoudreContestationDialog } from "./resoudre-contestation-dialog"

interface ContestationsListProps {
  contestations: ContestationWithDetails[]
  onResoudre: (payload: { id: string; acceptee: boolean; commentaire: string }) => Promise<void>
}

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

const statutVariants: Record<
  ContestationWithDetails["statut"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  en_cours: {
    label: "En cours",
    className: "bg-warning/10 text-warning border-warning/20",
    icon: <Clock className="size-3 mr-1" />,
  },
  acceptee: {
    label: "Acceptee",
    className: "bg-success/10 text-success border-success/20",
    icon: <CheckCircle2 className="size-3 mr-1" />,
  },
  rejetee: {
    label: "Rejetee",
    className: "bg-muted text-muted-foreground border-muted",
    icon: <Ban className="size-3 mr-1" />,
  },
}

export function ContestationsList({ contestations, onResoudre }: ContestationsListProps) {
  const columns = React.useMemo<ColumnDef<ContestationWithDetails>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <div className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={row.original.id}>
            {row.original.id}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "motif",
        header: "Motif",
        cell: ({ row }) => (
          <div className="max-w-[320px] truncate text-sm" title={row.original.motif}>
            {row.original.motif}
          </div>
        ),
        size: 320,
      },
      {
        accessorKey: "dateContestation",
        header: "Date contestation",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.dateContestation)}</span>,
        size: 130,
      },
      {
        accessorKey: "dateLimite",
        header: "Date limite",
        cell: ({ row }) => {
          const limite = new Date(row.original.dateLimite)
          const isExpired = limite < new Date()
          return (
            <span className={`text-sm ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
              {formatDate(row.original.dateLimite)}
            </span>
          )
        },
        size: 130,
      },
      {
        accessorKey: "statut",
        header: "Statut",
        cell: ({ row }) => {
          const config = statutVariants[row.original.statut]
          return (
            <Badge variant="outline" className={config.className}>
              {config.icon}
              {config.label}
            </Badge>
          )
        },
        size: 130,
      },
      {
        accessorKey: "commentaireResolution",
        header: "Resolution",
        cell: ({ row }) => {
          if (!row.original.commentaireResolution) {
            return <span className="text-muted-foreground">-</span>
          }
          return (
            <div className="max-w-[260px] truncate text-sm" title={row.original.commentaireResolution}>
              {row.original.commentaireResolution}
            </div>
          )
        },
        size: 260,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isPending = row.original.statut === "en_cours"
          if (!isPending) {
            return <span className="text-xs text-muted-foreground">Deja resolue</span>
          }

          return (
            <ResoudreContestationDialog
              contestationId={row.original.id}
              onSubmit={onResoudre}
              trigger={
                <Button size="sm" variant="outline" className="gap-2">
                  <MessageSquareWarning className="size-4" />
                  Resoudre
                </Button>
              }
            />
          )
        },
        size: 140,
      },
    ],
    [onResoudre],
  )

  return <DataTable columns={columns} data={contestations} headerClassName="bg-sidebar hover:bg-sidebar" />
}

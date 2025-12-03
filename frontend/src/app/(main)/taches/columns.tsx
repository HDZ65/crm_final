"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Play, CheckCircle, XCircle, Trash2, Eye, AlertTriangle } from "lucide-react"
import type { TacheDto } from "@/types/tache"
import {
  TACHE_TYPE_LABELS,
  TACHE_PRIORITE_LABELS,
  TACHE_STATUT_LABELS,
  TACHE_PRIORITE_COLORS,
} from "@/types/tache"
import { format, isPast, isToday } from "date-fns"
import { fr } from "date-fns/locale"

interface ColumnsProps {
  onView?: (tache: TacheDto) => void
  onStart?: (tache: TacheDto) => void
  onComplete?: (tache: TacheDto) => void
  onCancel?: (tache: TacheDto) => void
  onDelete?: (tache: TacheDto) => void
}

export function getColumns(props: ColumnsProps = {}): ColumnDef<TacheDto>[] {
  const { onView, onStart, onComplete, onCancel, onDelete } = props

  return [
    {
      accessorKey: "titre",
      header: "Titre",
      cell: ({ row }) => {
        const tache = row.original
        const isLate = tache.statut !== 'TERMINEE' && tache.statut !== 'ANNULEE' && isPast(new Date(tache.dateEcheance))

        return (
          <div className="flex items-center gap-2">
            {isLate && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <span className={isLate ? "text-destructive font-medium" : ""}>
              {tache.titre}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => TACHE_TYPE_LABELS[row.original.type] || row.original.type,
    },
    {
      accessorKey: "priorite",
      header: "Priorité",
      cell: ({ row }) => {
        const priorite = row.original.priorite
        const color = TACHE_PRIORITE_COLORS[priorite] as "destructive" | "default" | "secondary"
        return (
          <Badge variant={color}>
            {TACHE_PRIORITE_LABELS[priorite]}
          </Badge>
        )
      },
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statut
        let variant: "outline" | "default" | "secondary" | "destructive" = "outline"

        switch (statut) {
          case 'EN_COURS':
            variant = "default"
            break
          case 'TERMINEE':
            variant = "secondary"
            break
          case 'ANNULEE':
            variant = "destructive"
            break
        }

        return (
          <Badge variant={variant}>
            {TACHE_STATUT_LABELS[statut]}
          </Badge>
        )
      },
    },
    {
      accessorKey: "dateEcheance",
      header: "Échéance",
      cell: ({ row }) => {
        const date = new Date(row.original.dateEcheance)
        const statut = row.original.statut
        const isLate = statut !== 'TERMINEE' && statut !== 'ANNULEE' && isPast(date)
        const isDueToday = isToday(date)

        let className = ""
        if (isLate) className = "text-destructive font-medium"
        else if (isDueToday) className = "text-orange-600 font-medium"

        return (
          <span className={className}>
            {format(date, "dd MMM yyyy", { locale: fr })}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tache = row.original
        const canStart = tache.statut === 'A_FAIRE'
        const canComplete = tache.statut === 'A_FAIRE' || tache.statut === 'EN_COURS'
        const canCancel = tache.statut !== 'TERMINEE' && tache.statut !== 'ANNULEE'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onView && (
                <DropdownMenuItem onClick={() => onView(tache)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les détails
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canStart && onStart && (
                <DropdownMenuItem onClick={() => onStart(tache)}>
                  <Play className="mr-2 h-4 w-4" />
                  Démarrer
                </DropdownMenuItem>
              )}
              {canComplete && onComplete && (
                <DropdownMenuItem onClick={() => onComplete(tache)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Terminer
                </DropdownMenuItem>
              )}
              {canCancel && onCancel && (
                <DropdownMenuItem onClick={() => onCancel(tache)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(tache)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

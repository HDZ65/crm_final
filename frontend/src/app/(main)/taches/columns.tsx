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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import type { TacheDto, TachePriorite } from "@/types/tache"
import {
  TACHE_TYPE_LABELS,
  TACHE_PRIORITE_LABELS,
  TACHE_STATUT_LABELS,
} from "@/types/tache"
import { format, isPast, isToday } from "date-fns"
import { fr } from "date-fns/locale"

// Icônes et couleurs pour les priorités
const PRIORITE_CONFIG: Record<TachePriorite, { icon: React.ElementType; color: string; label: string }> = {
  HAUTE: { icon: ArrowUp, color: "text-destructive", label: "Haute" },
  MOYENNE: { icon: Minus, color: "text-blue-500", label: "Moyenne" },
  BASSE: { icon: ArrowDown, color: "text-muted-foreground", label: "Basse" },
}

interface Membre {
  utilisateurId: string
  utilisateur?: {
    id: string
    email: string
    prenom: string | null
    nom: string | null
  }
}

interface ColumnsProps {
  onView?: (tache: TacheDto) => void
  onStart?: (tache: TacheDto) => void
  onComplete?: (tache: TacheDto) => void
  onCancel?: (tache: TacheDto) => void
  onDelete?: (tache: TacheDto) => void
  membres?: Membre[]
}

export function getColumns(props: ColumnsProps = {}): ColumnDef<TacheDto>[] {
  const { onView, onStart, onComplete, onCancel, onDelete, membres = [] } = props

  const getMembreName = (userId: string) => {
    const membre = membres.find((m) => m.utilisateurId === userId)
    if (!membre?.utilisateur) return userId.slice(0, 8) + "..."
    const { prenom, nom, email } = membre.utilisateur
    if (prenom || nom) return [prenom, nom].filter(Boolean).join(" ")
    return email || userId.slice(0, 8) + "..."
  }

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
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description
        if (!description) return <span className="text-muted-foreground">-</span>

        const maxLength = 50
        const isTruncated = description.length > maxLength
        const displayText = isTruncated
          ? description.slice(0, maxLength) + "..."
          : description

        if (isTruncated) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-help truncate max-w-[200px] block">
                    {displayText}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="whitespace-pre-wrap">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }

        return <span className="text-muted-foreground">{displayText}</span>
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
        const config = PRIORITE_CONFIG[priorite]
        const Icon = config.icon

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statut

        const statusStyles: Record<string, string> = {
          A_FAIRE: "bg-info/10 text-info border-info/20",
          EN_COURS: "bg-warning/10 text-warning border-warning/20",
          TERMINEE: "bg-success/10 text-success border-success/20",
          ANNULEE: "bg-destructive/10 text-destructive border-destructive/20",
        }

        return (
          <Badge variant="outline" className={statusStyles[statut]}>
            {TACHE_STATUT_LABELS[statut]}
          </Badge>
        )
      },
    },
    {
      accessorKey: "assigneA",
      header: "Assigné à",
      cell: ({ row }) => {
        const name = getMembreName(row.original.assigneA)
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[120px]">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "dateEcheance",
      header: "Échéance",
      cell: ({ row }) => {
        const date = new Date(row.original.dateEcheance)
        const statut = row.original.statut
        const isActive = statut !== 'TERMINEE' && statut !== 'ANNULEE'
        const isLate = isActive && isPast(date)
        const isDueToday = isActive && isToday(date)

        let className = ""
        if (isLate) className = "text-destructive font-medium"
        else if (isDueToday) className = "text-warning font-medium"

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

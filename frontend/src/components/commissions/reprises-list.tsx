"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table-basic"
import { ColumnDef } from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  XCircle,
  Clock,
  CheckCircle2,
  Ban,
  AlertTriangle,
  RotateCcw,
  FileText,
} from "lucide-react"
import type { RepriseCommissionResponseDto, StatutReprise, TypeReprise } from "@/types/commission"

interface ReprisesListProps {
  reprises: RepriseCommissionResponseDto[]
  loading?: boolean
  onCancel?: (repriseId: string, motif: string) => Promise<void>
  onViewDetails?: (reprise: RepriseCommissionResponseDto) => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

// Labels pour les types de reprise
const typeRepriseLabels: Record<TypeReprise, string> = {
  resiliation: "Résiliation",
  impaye: "Impayé",
  annulation: "Annulation",
  regularisation: "Régularisation",
}

// Variantes pour les statuts de reprise
const statutRepriseVariants: Record<StatutReprise, { icon: React.ReactNode; className: string; label: string }> = {
  en_attente: {
    icon: <Clock className="size-3 mr-1" />,
    className: "bg-warning/10 text-warning border-warning/20",
    label: "En attente",
  },
  appliquee: {
    icon: <CheckCircle2 className="size-3 mr-1" />,
    className: "bg-success/10 text-success border-success/20",
    label: "Appliquée",
  },
  annulee: {
    icon: <Ban className="size-3 mr-1" />,
    className: "bg-muted text-muted-foreground border-muted",
    label: "Annulée",
  },
}

export function ReprisesList({ reprises, loading, onCancel, onViewDetails }: ReprisesListProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false)
  const [selectedReprise, setSelectedReprise] = React.useState<RepriseCommissionResponseDto | null>(null)
  const [cancelMotif, setCancelMotif] = React.useState("")
  const [cancelError, setCancelError] = React.useState("")
  const [cancelling, setCancelling] = React.useState(false)

  const handleCancelClick = (reprise: RepriseCommissionResponseDto) => {
    setSelectedReprise(reprise)
    setCancelDialogOpen(true)
    setCancelMotif("")
    setCancelError("")
  }

  const handleConfirmCancel = async () => {
    if (!cancelMotif.trim()) {
      setCancelError("Le motif est obligatoire pour annuler une reprise")
      return
    }
    if (cancelMotif.trim().length < 10) {
      setCancelError("Le motif doit contenir au moins 10 caractères")
      return
    }

    if (selectedReprise && onCancel) {
      setCancelling(true)
      try {
        await onCancel(selectedReprise.id, cancelMotif)
        setCancelDialogOpen(false)
        setSelectedReprise(null)
        setCancelMotif("")
      } catch {
        setCancelError("Erreur lors de l'annulation")
      } finally {
        setCancelling(false)
      }
    }
  }

  const columns: ColumnDef<RepriseCommissionResponseDto>[] = [
    {
      accessorKey: "reference",
      header: "Référence",
      cell: ({ row }) => (
        <div className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={row.original.reference}>
          {row.original.reference}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "typeReprise",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.typeReprise
        return (
          <Badge variant="outline" className="capitalize">
            {typeRepriseLabels[type] || type}
          </Badge>
        )
      },
      size: 120,
    },
    {
      accessorKey: "montantReprise",
      header: "Montant",
      cell: ({ row }) => (
        <div className="font-semibold text-destructive flex items-center gap-1">
          <RotateCcw className="size-3" />
          {formatCurrency(row.original.montantReprise)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "montantOriginal",
      header: "Montant original",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatCurrency(row.original.montantOriginal)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "tauxReprise",
      header: "Taux",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.tauxReprise}%</div>
      ),
      size: 80,
    },
    {
      accessorKey: "periodeOrigine",
      header: "Période origine",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.periodeOrigine}</div>
      ),
      size: 100,
    },
    {
      accessorKey: "periodeApplication",
      header: "Application",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.periodeApplication}</div>
      ),
      size: 100,
    },
    {
      accessorKey: "dateEvenement",
      header: "Date événement",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.dateEvenement)}
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: "dateLimite",
      header: "Date limite",
      cell: ({ row }) => {
        const dateLimite = new Date(row.original.dateLimite)
        const isExpired = dateLimite < new Date()
        return (
          <div className={`text-sm ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
            {formatDate(row.original.dateLimite)}
          </div>
        )
      },
      size: 110,
    },
    {
      accessorKey: "statutReprise",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statutReprise
        const variant = statutRepriseVariants[statut] || statutRepriseVariants.en_attente
        return (
          <Badge variant="outline" className={variant.className}>
            {variant.icon}
            {variant.label}
          </Badge>
        )
      },
      size: 120,
    },
    {
      accessorKey: "motif",
      header: "Motif",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground max-w-[150px] truncate" title={row.original.motif || ""}>
          {row.original.motif || "—"}
        </div>
      ),
      size: 150,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const reprise = row.original
        const canCancel = reprise.statutReprise === "en_attente"

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menu actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(reprise.reference)}>
                <FileText className="size-4 mr-2" />
                Copier la référence
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(reprise)}>
                  <Eye className="size-4 mr-2" />
                  Voir les détails
                </DropdownMenuItem>
              )}
              {canCancel && onCancel && (
                <DropdownMenuItem
                  onClick={() => handleCancelClick(reprise)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="size-4 mr-2" />
                  Annuler la reprise
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={reprises}
        headerClassName="bg-sidebar hover:bg-sidebar"
      />

      {/* Dialog d'annulation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" />
              Annuler la reprise
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d&apos;annuler la reprise <strong>{selectedReprise?.reference}</strong>.
              <br />
              Cette action est irréversible. Veuillez indiquer le motif.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancel-motif">Motif d&apos;annulation *</Label>
              <Textarea
                id="cancel-motif"
                placeholder="Ex: Erreur de saisie, contrat maintenu, accord commercial..."
                value={cancelMotif}
                onChange={(e) => {
                  setCancelMotif(e.target.value)
                  setCancelError("")
                }}
                rows={4}
                className={cancelError ? "border-destructive" : ""}
              />
              {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
              <p className="text-xs text-muted-foreground">
                Minimum 10 caractères. Ce motif sera enregistré dans le journal d&apos;audit.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={cancelling}>
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

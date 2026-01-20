"use client"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  MoreHorizontal,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Eye,
  FileText,
  RotateCcw,
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import type { CommissionWithDetailsResponseDto, TypeApporteur } from "@/types/commission"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

// Mapping des types d'apporteur pour l'affichage
const typeApporteurLabels: Record<TypeApporteur, string> = {
  vrp: "VRP",
  manager: "Manager",
  directeur: "Directeur",
  partenaire: "Partenaire",
}

// Mapping des statuts par code
const statutVariants: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  en_attente: {
    icon: <Clock className="size-3 mr-1" />,
    className: "bg-warning/10 text-warning border-warning/20",
    label: "En attente",
  },
  validee: {
    icon: <CheckCircle2 className="size-3 mr-1" />,
    className: "bg-success/10 text-success border-success/20",
    label: "Validée",
  },
  reprise: {
    icon: <RotateCcw className="size-3 mr-1" />,
    className: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Reprise",
  },
  payee: {
    icon: <DollarSign className="size-3 mr-1" />,
    className: "bg-info/10 text-info border-info/20",
    label: "Payée",
  },
  contestee: {
    icon: <AlertTriangle className="size-3 mr-1" />,
    className: "bg-warning/10 text-warning border-warning/20",
    label: "Contestée",
  },
}

export const createColumns = (
  onViewDetails: (commission: CommissionWithDetailsResponseDto) => void
): ColumnDef<CommissionWithDetailsResponseDto>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      const commission = row.original
      const statutCode = commission.statut?.code?.toLowerCase() || ""
      const isDisabled = statutCode === "payee" || statutCode === "validee"

      return (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            disabled={isDisabled}
          />
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 36,
  },
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
    accessorKey: "apporteur",
    header: "Apporteur",
    cell: ({ row }) => {
      const apporteur = row.original.apporteur
      if (!apporteur) return <div className="text-muted-foreground">—</div>

      const fullName = `${apporteur.prenom} ${apporteur.nom}`.trim()
      const typeLabel = typeApporteurLabels[apporteur.typeApporteur] || apporteur.typeApporteur

      return (
        <div className="flex flex-col max-w-[150px]">
          <span className="font-medium text-foreground truncate" title={fullName}>
            {fullName}
          </span>
          <Badge variant="outline" className="w-fit mt-1 text-xs bg-secondary text-secondary-foreground border-border">
            {typeLabel}
          </Badge>
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "contrat",
    header: "Contrat",
    cell: ({ row }) => {
      const contrat = row.original.contrat
      if (!contrat) return <div className="text-muted-foreground">—</div>

      return (
        <div className="flex flex-col max-w-[130px]">
          <span className="font-mono text-xs text-foreground truncate" title={contrat.referenceExterne}>
            {contrat.referenceExterne}
          </span>
          <span className="text-xs text-muted-foreground truncate" title={contrat.clientNom}>
            {contrat.clientNom}
          </span>
        </div>
      )
    },
    size: 130,
  },
  {
    accessorKey: "produit",
    header: "Produit",
    cell: ({ row }) => {
      const produit = row.original.produit
      if (!produit) return <div className="text-muted-foreground">—</div>

      return (
        <div className="flex flex-col gap-1 max-w-[140px]">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 truncate" title={produit.nom}>
            {produit.nom}
          </Badge>
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: "compagnie",
    header: "Compagnie",
    cell: ({ row }) => (
      <div className="text-sm text-foreground max-w-[120px] truncate" title={row.original.compagnie}>
        {row.original.compagnie}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "typeBase",
    header: "Base",
    cell: ({ row }) => {
      const baseLabels: Record<string, string> = {
        cotisation_ht: "Cotisation HT",
        ca_ht: "% CA",
        forfait: "Forfait fixe",
      }
      const label = baseLabels[row.original.typeBase] || row.original.typeBase
      return (
        <div className="text-xs text-muted-foreground max-w-[100px] truncate" title={label}>
          {label}
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: "montantBrut",
    header: "Brut",
    cell: ({ row }) => (
      <div className="font-semibold text-foreground">
        {formatCurrency(row.original.montantBrut)}
      </div>
    ),
    size: 100,
  },
  {
    accessorKey: "montantReprises",
    header: "Reprises",
    cell: ({ row }) => {
      const reprises = row.original.montantReprises
      if (reprises === 0) return <div className="text-muted-foreground">—</div>
      return (
        <div className="font-medium text-destructive flex items-center gap-1">
          <RotateCcw className="size-3" />
          {formatCurrency(-reprises)}
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: "montantAcomptes",
    header: "Acomptes",
    cell: ({ row }) => {
      const acomptes = row.original.montantAcomptes
      if (acomptes === 0) return <div className="text-muted-foreground">—</div>
      return (
        <div className="font-medium text-muted-foreground">
          {formatCurrency(-acomptes)}
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: "montantNetAPayer",
    header: "Net à payer",
    cell: ({ row }) => {
      const net = row.original.montantNetAPayer
      const color = net > 0 ? "text-success" : net < 0 ? "text-destructive" : "text-muted-foreground"
      return (
        <div className={`font-bold text-base ${color}`}>
          {formatCurrency(net)}
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ row }) => {
      const statut = row.original.statut
      if (!statut) return <div className="text-muted-foreground">—</div>

      const code = statut.code?.toLowerCase() || "en_attente"
      const variant = statutVariants[code] || statutVariants["en_attente"]

      return (
        <Badge variant="outline" className={variant.className}>
          {variant.icon}
          {statut.nom || variant.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "periode",
    header: "Période",
    cell: ({ row }) => (
      <div className="text-sm text-foreground max-w-[100px] truncate" title={row.original.periode}>
        {row.original.periode}
      </div>
    ),
    size: 100,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const commission = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(commission.reference)}>
              <FileText className="size-4 mr-2" />
              Copier la référence
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails(commission)}>
              <Eye className="size-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 50,
  },
]

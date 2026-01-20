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
import { MoreHorizontal, Eye, Download, Send, Ban } from "lucide-react"
import type { Facture } from "@/types/facture"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const STATUT_STYLES: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  emise: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  envoyee: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  payee: "bg-green-100 text-green-800 hover:bg-green-100",
  partiellement_payee: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  en_retard: "bg-red-100 text-red-800 hover:bg-red-100",
  annulee: "bg-gray-100 text-gray-500 hover:bg-gray-100",
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  emise: "Émise",
  envoyee: "Envoyée",
  payee: "Payée",
  partiellement_payee: "Part. payée",
  en_retard: "En retard",
  annulee: "Annulée",
}

export const columns: ColumnDef<Facture>[] = [
  {
    accessorKey: "numero",
    header: "N° Facture",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("numero")}</span>
    ),
  },
  {
    accessorKey: "dateEmission",
    header: "Date d'émission",
    cell: ({ row }) => {
      const date = row.getValue("dateEmission") as string
      return date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : "-"
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client
      if (!client) return "-"
      return `${client.prenom} ${client.nom}`
    },
  },
  {
    accessorKey: "montantHT",
    header: () => <div className="text-right">Montant HT</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("montantHT"))
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
      return <div className="text-right font-medium tabular-nums">{formatted}</div>
    },
  },
  {
    accessorKey: "montantTTC",
    header: () => <div className="text-right">Montant TTC</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("montantTTC"))
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
      return <div className="text-right font-semibold tabular-nums">{formatted}</div>
    },
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ row }) => {
      const statut = row.original.statut
      const code = statut?.code || "brouillon"
      return (
        <Badge className={STATUT_STYLES[code] || STATUT_STYLES.brouillon}>
          {STATUT_LABELS[code] || statut?.nom || "Brouillon"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const facture = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(facture.numero)}>
              Copier le numéro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="mr-2 h-4 w-4" />
              Envoyer par email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              Annuler
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

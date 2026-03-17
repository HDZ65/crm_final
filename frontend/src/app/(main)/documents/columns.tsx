"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Download } from "lucide-react"
import type { PieceJointe } from "@proto/documents/documents"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DocumentTypeBadge } from "@/components/documents/document-type-badge"

export const columns: ColumnDef<PieceJointe>[] = [
  {
    accessorKey: "nomFichier",
    header: "Nom du fichier",
    cell: ({ row }) => {
      const nomFichier = row.getValue("nomFichier") as string
      return <span className="font-medium">{nomFichier}</span>
    },
  },
  {
    accessorKey: "typeDocument",
    header: "Type de document",
    cell: ({ row }) => {
      const typeDocument = row.original.typeDocument
      return <DocumentTypeBadge typeDocument={typeDocument} />
    },
  },
  {
    accessorKey: "typeMime",
    header: "Type MIME",
    cell: ({ row }) => {
      const typeMime = row.getValue("typeMime") as string
      return <span className="text-sm text-muted-foreground">{typeMime}</span>
    },
  },
  {
    accessorKey: "taille",
    header: () => <div className="text-right">Taille</div>,
    cell: ({ row }) => {
      const taille = row.getValue("taille") as number
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "unit",
        unit: "byte",
        unitDisplay: "short",
      }).format(taille)
      return <div className="text-right text-sm">{formatted}</div>
    },
  },
  {
    accessorKey: "dateUpload",
    header: "Date d'upload",
    cell: ({ row }) => {
      const date = row.getValue("dateUpload") as string
      return date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : "-"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(document.nomFichier)}>
              Copier le nom
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

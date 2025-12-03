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
import { MoreHorizontal, CheckCircle2, XCircle, Mail, Phone, Copy, Eye, Edit, Trash2, User } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import type { Commercial, TypeCommercial } from "@/types/commercial"
import { getCommercialFullName, getTypeCommercialLabel } from "@/types/commercial"

// Couleurs pour les types de commercial
const TYPE_COLORS: Record<TypeCommercial, { bg: string; text: string }> = {
  vrp: { bg: "bg-blue-100", text: "text-blue-700" },
  manager: { bg: "bg-purple-100", text: "text-purple-700" },
  directeur: { bg: "bg-amber-100", text: "text-amber-700" },
  partenaire: { bg: "bg-teal-100", text: "text-teal-700" },
}

export const columns: ColumnDef<Commercial>[] = [
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
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
  },
  {
    accessorKey: "nom",
    header: () => (
      <div className="flex items-center gap-1.5">
        <User className="size-4" />
        Nom
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-slate-800">
        {getCommercialFullName(row.original)}
      </div>
    ),
  },
  {
    accessorKey: "typeApporteur",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.typeApporteur
      const colors = TYPE_COLORS[type] || { bg: "bg-gray-100", text: "text-gray-700" }
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text}`}>
          {getTypeCommercialLabel(type)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "email",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Mail className="size-4" />
        Email
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700 lowercase">
        {row.original.email || "-"}
      </div>
    ),
  },
  {
    accessorKey: "telephone",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Phone className="size-4" />
        Téléphone
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-slate-700">
        {row.original.telephone || "-"}
      </div>
    ),
  },
  {
    accessorKey: "actif",
    header: "Statut",
    cell: ({ row }) => {
      const actif = row.original.actif
      if (actif) {
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-3 mr-1" />
            Actif
          </Badge>
        )
      }
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
          <XCircle className="size-3 mr-1" />
          Inactif
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const commercial = row.original
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(commercial.id)}>
              <Copy className="size-4 mr-2" />
              Copier l&apos;ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="size-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="size-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 className="size-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

"use client"

import * as React from "react"
import Link from "next/link"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useApiDelete } from "@/hooks/core"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, CheckCircle2, XCircle, AlertCircle, FileText, Eye, Edit, Trash2, Copy, Mail, Phone, Shield, Calendar } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { EditClientDialog } from "./edit-client-dialog"

export type ClientRow = {
  id: string
  name: string
  status: "Actif" | "Impayé" | "Suspendu"
  contracts: string[]
  createdAgo: string
  company?: string
  email?: string
  phone?: string
}

export const columns: ColumnDef<ClientRow>[] = [
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
    accessorKey: "name",
    header: "Dénomination",
    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.id}`}
        className="font-medium text-slate-800 hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Shield className="size-4" />
        Statut
      </div>
    ),
    cell: ({ row }) => {
      const value = row.original.status
      if (value === "Actif")
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-3 mr-1" />
            Actif
          </Badge>
        )
      if (value === "Impayé")
        return (
          <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200">
            <XCircle className="size-3 mr-1" />
            Impayé
          </Badge>
        )
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <AlertCircle className="size-3 mr-1" />
          Suspendu
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
    cell: ({ row }) => <div className="text-slate-700 lowercase">{row.original.email || "—"}</div>,
  },
  {
    accessorKey: "phone",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Phone className="size-4" />
        Téléphone
      </div>
    ),
    cell: ({ row }) => <div className="text-slate-700">{row.original.phone || "—"}</div>,
  },
  {
    accessorKey: "contracts",
    header: () => (
      <div className="flex items-center gap-1.5">
        <FileText className="size-4" />
        Contrats actifs
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.contracts.map((ct) => (
          <Badge key={ct} variant="outline" className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums text-slate-700">
            {ct}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "createdAgo",
    header: () => (
      <div className="flex items-center gap-1.5">
        <Calendar className="size-4" />
        Date de création
      </div>
    ),
    cell: ({ row }) => <div className="text-slate-600">{row.original.createdAgo}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell client={row.original} />,
  },
]

function ActionsCell({ client }: { client: ClientRow }) {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const { execute: deleteClient, loading: isDeleting } = useApiDelete("/clientbases", {
    onSuccess: () => {
      toast.success("Client supprimé", {
        description: `${client.name} a été supprimé avec succès.`,
      })
      setDeleteDialogOpen(false)
      window.location.reload()
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression", {
        description: error.message || "Une erreur est survenue.",
      })
    },
  })

  const handleDelete = () => {
    deleteClient(client.id)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
            <Copy className="size-4 mr-2" />
            Copier l&apos;ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/clients/${client.id}`} className="flex items-center">
              <Eye className="size-4 mr-2" />
              Voir la fiche
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
            <Edit className="size-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteDialogOpen(true)}>
            <Trash2 className="size-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{client.name}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

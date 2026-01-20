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
import { deleteClient } from "@/actions/clients"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, CheckCircle2, XCircle, AlertCircle, FileText, Eye, Edit, Trash2, Copy, Mail, Phone, Shield, Calendar } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { EditClientDialog } from "./edit-client-dialog"

// Formater un numéro de téléphone français (06 74 40 64 93)
function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "—"
  // Supprimer tous les caractères non numériques
  const digits = phone.replace(/\D/g, "")
  // Si c'est un numéro français à 10 chiffres
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
  }
  // Si c'est un numéro avec indicatif +33
  if (digits.length === 11 && digits.startsWith("33")) {
    const withoutPrefix = "0" + digits.slice(2)
    return withoutPrefix.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
  }
  // Sinon retourner tel quel
  return phone
}

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

export const createColumns = (onDeleted?: () => void): ColumnDef<ClientRow>[] => [
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
    header: "Client",
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
    cell: ({ row }) => (
      <div className="text-slate-700 font-mono text-sm tracking-wide">
        {formatPhoneNumber(row.original.phone)}
      </div>
    ),
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
    cell: ({ row }) => <ActionsCell client={row.original} onDeleted={onDeleted} />,
  },
]

function ActionsCell({ client, onDeleted }: { client: ClientRow; onDeleted?: () => void }) {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteClient(client.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error("Erreur lors de la suppression", {
        description: result.error,
      })
    } else {
      toast.success("Client supprimé", {
        description: `${client.name} a été supprimé avec succès.`,
      })
      setDeleteDialogOpen(false)
      onDeleted?.()
    }
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
          <DropdownMenuItem onClick={() => {
            const info = `${client.name}
Statut: ${client.status}
Email: ${client.email || "-"}
Téléphone: ${client.phone || "-"}
Contrats: ${client.contracts.length > 0 ? client.contracts.join(", ") : "-"}
Créé: ${client.createdAgo}`
            navigator.clipboard.writeText(info)
            toast.success("Informations copiées")
          }}>
            <Copy className="size-4 mr-2" />
            Copier les infos
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
      {editDialogOpen && (
        <EditClientDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          client={client}
          onSuccess={onDeleted}
        />
      )}
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

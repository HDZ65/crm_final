"use client"

import * as React from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, CheckCircle2, XCircle, Mail, Phone, Copy, Edit, Trash2, User } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import type { Apporteur } from "@proto/commerciaux/commerciaux"
import type { TypeCommercial } from "@/lib/ui/labels/commercial"
import { getCommercialFullName, getTypeCommercialLabel } from "@/lib/ui/labels/commercial"

// Formater un numéro de téléphone français (06 74 40 64 93)
function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-"
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
import { EditCommercialDialog } from "@/components/commerciaux/edit-commercial-dialog"
import { deleteApporteur } from "@/actions/commerciaux"

// Couleurs pour les types de commercial (contraste WCAG AA)
const TYPE_COLORS: Record<TypeCommercial, { bg: string; text: string }> = {
  vrp: { bg: "bg-blue-100", text: "text-blue-800" },
  manager: { bg: "bg-purple-100", text: "text-purple-800" },
  directeur: { bg: "bg-amber-100", text: "text-amber-800" },
  partenaire: { bg: "bg-teal-100", text: "text-teal-800" },
}

// Composant pour les actions avec gestion de l'état des dialogs
function ActionsCell({ commercial, onRefresh }: { commercial: Apporteur; onRefresh: () => void }) {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const handleDelete = async () => {
    setDeleteLoading(true)
    const result = await deleteApporteur(commercial.id)
    setDeleteLoading(false)
    if (result.data?.success) {
      toast.success("Commercial supprimé avec succès")
      setDeleteDialogOpen(false)
      onRefresh()
    } else {
      toast.error(result.error || "Erreur lors de la suppression du commercial")
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
            const info = `${getCommercialFullName(commercial)}
Type: ${getTypeCommercialLabel(commercial.typeApporteur as TypeCommercial)}
Email: ${commercial.email || "-"}
Téléphone: ${commercial.telephone || "-"}
Statut: ${commercial.actif ? "Actif" : "Inactif"}`
            navigator.clipboard.writeText(info)
            toast.success("Informations copiées")
          }}>
            <Copy className="size-4 mr-2" />
            Copier les infos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="size-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="size-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCommercialDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        commercial={commercial}
        onSuccess={onRefresh}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce commercial ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{getCommercialFullName(commercial)}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function createColumns(onRefresh: () => void): ColumnDef<Apporteur>[] {
  return [
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
      const type = row.original.typeApporteur as TypeCommercial
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
      <div className="text-slate-700 font-mono text-sm tracking-wide">
        {formatPhoneNumber(row.original.telephone)}
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
      return <ActionsCell commercial={commercial} onRefresh={onRefresh} />
    },
  },
  ]
}

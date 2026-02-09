"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Power, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { activerApporteur, desactiverApporteur, deleteApporteur } from "@/actions/commerciaux"
import { getCommercialFullName, getTypeCommercialLabel } from "@/lib/ui/labels/commercial"
import { EditCommercialDialog } from "@/components/commerciaux/edit-commercial-dialog"
import type { Apporteur } from "@proto/commerciaux/commerciaux"

interface CommercialHeaderProps {
  commercial: Apporteur
  onUpdate: () => void
  onDelete: () => void
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  vrp: { bg: "bg-blue-100", text: "text-blue-800" },
  manager: { bg: "bg-purple-100", text: "text-purple-800" },
  directeur: { bg: "bg-amber-100", text: "text-amber-800" },
  partenaire: { bg: "bg-teal-100", text: "text-teal-800" },
}

export function CommercialHeader({ commercial, onUpdate, onDelete }: CommercialHeaderProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [toggleLoading, setToggleLoading] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const handleToggleActif = async () => {
    setToggleLoading(true)
    const action = commercial.actif ? desactiverApporteur : activerApporteur
    const result = await action(commercial.id)
    setToggleLoading(false)
    if (result.data) {
      toast.success(result.data.actif ? "Commercial activé" : "Commercial désactivé")
      onUpdate()
    } else {
      toast.error(result.error || "Erreur")
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    const result = await deleteApporteur(commercial.id)
    setDeleteLoading(false)
    if (result.data?.success) {
      toast.success("Commercial supprimé")
      router.push("/commerciaux")
      onDelete()
    } else {
      toast.error(result.error || "Erreur lors de la suppression")
    }
  }

  const typeColors = TYPE_COLORS[commercial.typeApporteur.toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-700" }

  return (
    <>
      <Card className="bg-sidebar text-sidebar-foreground">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Link href="/commerciaux">
                <Button variant="outline" size="icon" aria-label="Retour">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-base md:text-2xl font-semibold tracking-tight">
                  {getCommercialFullName(commercial)}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {commercial.actif ? (
                    <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-50">
                      <CheckCircle2 className="size-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-400/20 text-slate-300">
                      <XCircle className="size-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                  <Badge className={`${typeColors.bg} ${typeColors.text}`}>
                    {getTypeCommercialLabel(commercial.typeApporteur as any)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActif}
                disabled={toggleLoading}
              >
                <Power className="size-4" />
                {toggleLoading ? "..." : commercial.actif ? "Désactiver" : "Activer"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EditCommercialDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        commercial={commercial}
        onSuccess={onUpdate}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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

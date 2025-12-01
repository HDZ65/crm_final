"use client"

import * as React from "react"
import { X } from "lucide-react"
import { TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useDeleteSociete } from "@/hooks/clients"

interface GroupeTabProps {
  id: string
  nom: string
  onDeleted?: () => void
}

export function GroupeTab({ id, nom, onDeleted }: GroupeTabProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const { deleteSociete, loading } = useDeleteSociete()

  const handleDelete = async () => {
    try {
      await deleteSociete(id)
      toast.success(`Groupe "${nom}" supprimé`)
      setShowDeleteDialog(false)
      onDeleted?.()
    } catch {
      toast.error("Erreur lors de la suppression du groupe")
    }
  }

  const handleClickX = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDeleteDialog(true)
  }

  return (
    <>
      <TabsTrigger value={id} className="group relative pr-7">
        {nom}
        <span
          onClick={handleClickX}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity cursor-pointer"
        >
          <X className="size-3" />
        </span>
      </TabsTrigger>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le groupe &quot;{nom}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

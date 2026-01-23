"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createActivite, updateActivite, deleteActivite } from "@/actions/activites"
import type { ActiviteDto, TypeActiviteDto } from "@/types/activite"
import { Loader2, Trash2 } from "lucide-react"
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

interface ActiviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activite?: ActiviteDto | null
  typesActivite: TypeActiviteDto[]
  clientBaseId?: string
  contratId?: string
  onSuccess?: () => void
}

export function ActiviteDialog({
  open,
  onOpenChange,
  activite,
  typesActivite,
  clientBaseId,
  contratId,
  onSuccess,
}: ActiviteDialogProps) {
  const isEditing = !!activite
  const [loading, setLoading] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const [formData, setFormData] = React.useState({
    typeId: "",
    sujet: "",
    commentaire: "",
    dateActivite: new Date().toISOString().split("T")[0],
    echeance: "",
  })

  React.useEffect(() => {
    if (activite) {
      setFormData({
        typeId: activite.typeId,
        sujet: activite.sujet,
        commentaire: activite.commentaire || "",
        dateActivite: activite.dateActivite.split("T")[0],
        echeance: activite.echeance?.split("T")[0] || "",
      })
    } else {
      setFormData({
        typeId: typesActivite[0]?.id || "",
        sujet: "",
        commentaire: "",
        dateActivite: new Date().toISOString().split("T")[0],
        echeance: "",
      })
    }
  }, [activite, typesActivite, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.typeId || !formData.sujet) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    setLoading(true)

    if (isEditing && activite) {
      const result = await updateActivite({
        id: activite.id,
        typeId: formData.typeId,
        sujet: formData.sujet,
        commentaire: formData.commentaire || undefined,
        dateActivite: formData.dateActivite,
        echeance: formData.echeance || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Activité mise à jour")
        onOpenChange(false)
        onSuccess?.()
      }
    } else {
      const result = await createActivite({
        typeId: formData.typeId,
        sujet: formData.sujet,
        commentaire: formData.commentaire || undefined,
        dateActivite: formData.dateActivite,
        echeance: formData.echeance || undefined,
        clientBaseId,
        contratId,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Activité créée")
        onOpenChange(false)
        onSuccess?.()
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!activite) return

    setLoading(true)
    const result = await deleteActivite(activite.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Activité supprimée")
      setDeleteDialogOpen(false)
      onOpenChange(false)
      onSuccess?.()
    }

    setLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier l'activité" : "Nouvelle activité"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations de l'activité"
                : "Enregistrez une nouvelle activité commerciale"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="typeId">Type d'activité *</Label>
              <Select
                value={formData.typeId}
                onValueChange={(v) => setFormData((p) => ({ ...p, typeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {typesActivite.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sujet">Sujet *</Label>
              <Input
                id="sujet"
                value={formData.sujet}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, sujet: e.target.value }))
                }
                placeholder="Objet de l'activité"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, commentaire: e.target.value }))
                }
                placeholder="Détails ou notes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateActivite">Date *</Label>
                <Input
                  id="dateActivite"
                  type="date"
                  value={formData.dateActivite}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, dateActivite: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="echeance">Échéance (optionnel)</Label>
                <Input
                  id="echeance"
                  type="date"
                  value={formData.echeance}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, echeance: e.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="size-4 mr-1" />
                  Supprimer
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {isEditing ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

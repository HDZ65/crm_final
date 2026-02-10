"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  listTypesActivite,
  createTypeActivite,
  updateTypeActivite,
  deleteTypeActivite,
} from "@/actions/type-activites"
import type { TypeActiviteDto } from "@/actions/type-activites"
import { Plus, Pencil, Trash2, Loader2, Tags, Search } from "lucide-react"

interface TypesActivitesPageClientProps {
  initialTypes?: TypeActiviteDto[] | null
}

export function TypesActivitesPageClient({ initialTypes }: TypesActivitesPageClientProps) {
  const [types, setTypes] = React.useState<TypeActiviteDto[]>(initialTypes || [])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<TypeActiviteDto | null>(null)
  const [formData, setFormData] = React.useState({
    code: "",
    nom: "",
    description: "",
  })

  const fetchTypes = React.useCallback(async () => {
    setLoading(true)
    const result = await listTypesActivite()
    if (result.data) {
      setTypes(result.data)
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const filteredTypes = React.useMemo(() => {
    if (!search) return types
    const q = search.toLowerCase()
    return types.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.nom.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }, [types, search])

  const handleCreate = () => {
    setSelectedType(null)
    setFormData({ code: "", nom: "", description: "" })
    setDialogOpen(true)
  }

  const handleEdit = (type: TypeActiviteDto) => {
    setSelectedType(type)
    setFormData({
      code: type.code,
      nom: type.nom,
      description: type.description || "",
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (type: TypeActiviteDto) => {
    setSelectedType(type)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.nom) {
      toast.error("Code et nom sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedType) {
      const result = await updateTypeActivite({
        id: selectedType.id,
        ...formData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Type d'activité mis à jour")
        setDialogOpen(false)
        fetchTypes()
      }
    } else {
      const result = await createTypeActivite(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Type d'activité créé")
        setDialogOpen(false)
        fetchTypes()
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedType) return

    setLoading(true)
    const result = await deleteTypeActivite(selectedType.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Type d'activité supprimé")
      setDeleteDialogOpen(false)
      fetchTypes()
    }

    setLoading(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="size-6" />
            Types d'activités
          </h1>
          <p className="text-muted-foreground">
            Gérez les types d'activités commerciales (appels, emails, réunions, etc.)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          Nouveau type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des types</CardTitle>
              <CardDescription>
                {types.length} type{types.length > 1 ? "s" : ""} d'activité{types.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {search ? "Aucun résultat" : "Aucun type d'activité"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {type.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{type.nom}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {type.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(type)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(type)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? "Modifier le type" : "Nouveau type d'activité"}
            </DialogTitle>
            <DialogDescription>
              {selectedType
                ? "Modifiez les informations du type d'activité"
                : "Créez un nouveau type d'activité commerciale"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                placeholder="APPEL, EMAIL, REUNION..."
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Appel téléphonique"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedType ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le type{" "}
              <strong>{selectedType?.nom}</strong> ? Cette action est irréversible.
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
    </main>
  )
}

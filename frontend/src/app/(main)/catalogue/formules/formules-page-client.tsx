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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  getFormulesByProduit,
  createFormuleProduit,
  updateFormuleProduit,
  deleteFormuleProduit,
} from "@/actions/catalogue"
import type { Produit } from "@proto/products/products"
import { Plus, Pencil, Trash2, Loader2, FlaskConical, Search } from "lucide-react"

interface FormuleProduit {
  id: string
  produitId: string
  code: string
  nom: string
  description: string
  ordre: number
  prixFormule: number
  actif: boolean
  createdAt: string
  updatedAt: string
}

interface FormulesPageClientProps {
  initialProduits?: Produit[] | null
}

export function FormulesPageClient({ initialProduits }: FormulesPageClientProps) {
  const [produits] = React.useState<Produit[]>(initialProduits || [])
  const [selectedProduitId, setSelectedProduitId] = React.useState<string>("")
  const [formules, setFormules] = React.useState<FormuleProduit[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedFormule, setSelectedFormule] = React.useState<FormuleProduit | null>(null)
  const [formData, setFormData] = React.useState({
    code: "",
    nom: "",
    description: "",
    ordre: 0,
    prixFormule: 0,
  })

  const fetchFormules = React.useCallback(async (produitId: string) => {
    if (!produitId) return
    setLoading(true)
    const result = await getFormulesByProduit({ produitId })
    if (result.data) {
      setFormules(result.data.formules || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    if (selectedProduitId) {
      fetchFormules(selectedProduitId)
    } else {
      setFormules([])
    }
  }, [selectedProduitId, fetchFormules])

  const filteredFormules = React.useMemo(() => {
    if (!search) return formules
    const q = search.toLowerCase()
    return formules.filter(
      (f) =>
        f.nom.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
    )
  }, [formules, search])

  const handleCreate = () => {
    if (!selectedProduitId) {
      toast.error("Selectionnez un produit d'abord")
      return
    }
    setSelectedFormule(null)
    setFormData({ code: "", nom: "", description: "", ordre: 0, prixFormule: 0 })
    setDialogOpen(true)
  }

  const handleEdit = (formule: FormuleProduit) => {
    setSelectedFormule(formule)
    setFormData({
      code: formule.code,
      nom: formule.nom,
      description: formule.description || "",
      ordre: formule.ordre || 0,
      prixFormule: formule.prixFormule || 0,
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (formule: FormuleProduit) => {
    setSelectedFormule(formule)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.nom) {
      toast.error("Code et nom sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedFormule) {
      const result = await updateFormuleProduit({
        id: selectedFormule.id,
        code: formData.code,
        nom: formData.nom,
        description: formData.description,
        ordre: formData.ordre,
        prixFormule: formData.prixFormule,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Formule mise a jour")
        setDialogOpen(false)
        fetchFormules(selectedProduitId)
      }
    } else {
      const result = await createFormuleProduit({
        produitId: selectedProduitId,
        code: formData.code,
        nom: formData.nom,
        description: formData.description,
        ordre: formData.ordre,
        prixFormule: formData.prixFormule,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Formule creee")
        setDialogOpen(false)
        fetchFormules(selectedProduitId)
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedFormule) return

    setLoading(true)
    const result = await deleteFormuleProduit(selectedFormule.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Formule supprimee")
      setDeleteDialogOpen(false)
      fetchFormules(selectedProduitId)
    }

    setLoading(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="size-6" />
            Formules
          </h1>
          <p className="text-muted-foreground">
            Gerez les formules associees a vos produits.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={!selectedProduitId}>
          <Plus className="size-4 mr-2" />
          Nouvelle formule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Formules produit</CardTitle>
                <CardDescription>
                  {formules.length} formule{formules.length > 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Select value={selectedProduitId} onValueChange={setSelectedProduitId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map((produit) => (
                    <SelectItem key={produit.id} value={produit.id}>
                      {produit.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          {!selectedProduitId ? (
            <div className="text-center text-muted-foreground py-8">
              Selectionnez un produit pour voir ses formules.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {search ? "Aucun resultat" : "Aucune formule pour ce produit"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFormules.map((formule) => (
                    <TableRow key={formule.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {formule.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formule.nom}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {formule.description || "-"}
                      </TableCell>
                      <TableCell>
                        {formule.prixFormule ? `${formule.prixFormule} EUR` : "-"}
                      </TableCell>
                      <TableCell>{formule.ordre}</TableCell>
                      <TableCell>
                        <Badge variant={formule.actif ? "default" : "secondary"}>
                          {formule.actif ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(formule)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(formule)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedFormule ? "Modifier la formule" : "Nouvelle formule"}
            </DialogTitle>
            <DialogDescription>
              {selectedFormule
                ? "Modifiez les informations de la formule"
                : "Creez une nouvelle formule pour ce produit"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="FORMULE_CODE"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nom: e.target.value }))
                  }
                  placeholder="Nom de la formule"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description de la formule..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prixFormule">Prix</Label>
                <Input
                  id="prixFormule"
                  type="number"
                  step="0.01"
                  value={formData.prixFormule}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, prixFormule: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordre">Ordre</Label>
                <Input
                  id="ordre"
                  type="number"
                  value={formData.ordre}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, ordre: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
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
                {selectedFormule ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette formule ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer la formule{" "}
              <strong>{selectedFormule?.nom}</strong> ? Cette action est irreversible.
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

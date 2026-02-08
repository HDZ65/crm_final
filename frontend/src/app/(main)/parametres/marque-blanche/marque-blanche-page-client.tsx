"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { toast } from "sonner"
import {
  listPartenairesMarqueBlanche,
  createPartenaireMarqueBlancheAction,
  updatePartenaireMarqueBlancheAction,
  deletePartenaireMarqueBlancheAction,
  listThemesMarque,
  createThemeMarqueAction,
  updateThemeMarqueAction,
  deleteThemeMarqueAction,
  listStatutsPartenaire,
  createStatutPartenaireAction,
  updateStatutPartenaireAction,
  deleteStatutPartenaireAction,
} from "@/actions/marque-blanche"
import type {
  PartenaireMarqueBlanche,
  ThemeMarque,
  StatutPartenaire,
} from "@proto/organisations/organisations"
import { Plus, Pencil, Trash2, Loader2, Palette, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface MarqueBlanchePageClientProps {
  initialPartenaires?: PartenaireMarqueBlanche[] | null
  initialThemes?: ThemeMarque[] | null
  initialStatuts?: StatutPartenaire[] | null
  section?: "partenaires" | "themes" | "statuts"
}

export function MarqueBlanchePageClient({
  initialPartenaires,
  initialThemes,
  initialStatuts,
  section,
}: MarqueBlanchePageClientProps) {
  // Partenaires state
  const [partenaires, setPartenaires] = React.useState<PartenaireMarqueBlanche[]>(
    initialPartenaires || []
  )
  const [partenaireDialogOpen, setPartenaireDialogOpen] = React.useState(false)
  const [selectedPartenaire, setSelectedPartenaire] = React.useState<PartenaireMarqueBlanche | null>(
    null
  )
  const [partenaireFormData, setPartenaireFormData] = React.useState({
    nom: "",
    domaine: "",
    themeId: "",
    statutId: "",
    actif: true,
  })
  const [deletePartenaireDialogOpen, setDeletePartenaireDialogOpen] = React.useState(false)

  // Themes state
  const [themes, setThemes] = React.useState<ThemeMarque[]>(initialThemes || [])
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false)
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeMarque | null>(null)
  const [themeFormData, setThemeFormData] = React.useState({
    nom: "",
    couleurPrimaire: "#000000",
    couleurSecondaire: "#ffffff",
    logoUrl: "",
  })
  const [deleteThemeDialogOpen, setDeleteThemeDialogOpen] = React.useState(false)

  // Statuts state
  const [statuts, setStatuts] = React.useState<StatutPartenaire[]>(initialStatuts || [])
  const [statutDialogOpen, setStatutDialogOpen] = React.useState(false)
  const [selectedStatut, setSelectedStatut] = React.useState<StatutPartenaire | null>(null)
  const [statutFormData, setStatutFormData] = React.useState({
    code: "",
    libelle: "",
  })
  const [deleteStatutDialogOpen, setDeleteStatutDialogOpen] = React.useState(false)

  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Fetch functions
  const fetchPartenaires = React.useCallback(async () => {
    setLoading(true)
    const result = await listPartenairesMarqueBlanche()
    if (result.data) {
      setPartenaires(result.data.partenaires || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const fetchThemes = React.useCallback(async () => {
    setLoading(true)
    const result = await listThemesMarque()
    if (result.data) {
      setThemes(result.data.themes || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const fetchStatuts = React.useCallback(async () => {
    setLoading(true)
    const result = await listStatutsPartenaire()
    if (result.data) {
      setStatuts(result.data.statuts || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  // Partenaire handlers
  const handleCreatePartenaire = () => {
    setSelectedPartenaire(null)
    setPartenaireFormData({
      nom: "",
      domaine: "",
      themeId: "",
      statutId: "",
      actif: true,
    })
    setPartenaireDialogOpen(true)
  }

  const handleEditPartenaire = (partenaire: PartenaireMarqueBlanche) => {
    setSelectedPartenaire(partenaire)
    setPartenaireFormData({
      nom: partenaire.nom,
      domaine: partenaire.domaine,
      themeId: partenaire.themeId,
      statutId: partenaire.statutId,
      actif: partenaire.actif,
    })
    setPartenaireDialogOpen(true)
  }

  const handleSubmitPartenaire = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partenaireFormData.nom || !partenaireFormData.domaine) {
      toast.error("Nom et domaine sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedPartenaire) {
      const result = await updatePartenaireMarqueBlancheAction({
        id: selectedPartenaire.id,
        ...partenaireFormData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Partenaire mis à jour")
        setPartenaireDialogOpen(false)
        fetchPartenaires()
      }
    } else {
      const result = await createPartenaireMarqueBlancheAction(partenaireFormData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Partenaire créé")
        setPartenaireDialogOpen(false)
        fetchPartenaires()
      }
    }

    setLoading(false)
  }

  const handleDeletePartenaire = async () => {
    if (!selectedPartenaire) return

    setLoading(true)
    const result = await deletePartenaireMarqueBlancheAction(selectedPartenaire.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Partenaire supprimé")
      setDeletePartenaireDialogOpen(false)
      fetchPartenaires()
    }

    setLoading(false)
  }

  // Theme handlers
  const handleCreateTheme = () => {
    setSelectedTheme(null)
    setThemeFormData({
      nom: "",
      couleurPrimaire: "#000000",
      couleurSecondaire: "#ffffff",
      logoUrl: "",
    })
    setThemeDialogOpen(true)
  }

  const handleEditTheme = (theme: ThemeMarque) => {
    setSelectedTheme(theme)
    setThemeFormData({
      nom: theme.nom,
      couleurPrimaire: theme.couleurPrimaire,
      couleurSecondaire: theme.couleurSecondaire,
      logoUrl: theme.logoUrl || "",
    })
    setThemeDialogOpen(true)
  }

  const handleSubmitTheme = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!themeFormData.nom) {
      toast.error("Nom est obligatoire")
      return
    }

    setLoading(true)

    if (selectedTheme) {
      const result = await updateThemeMarqueAction({
        id: selectedTheme.id,
        ...themeFormData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Thème mis à jour")
        setThemeDialogOpen(false)
        fetchThemes()
      }
    } else {
      const result = await createThemeMarqueAction(themeFormData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Thème créé")
        setThemeDialogOpen(false)
        fetchThemes()
      }
    }

    setLoading(false)
  }

  const handleDeleteTheme = async () => {
    if (!selectedTheme) return

    setLoading(true)
    const result = await deleteThemeMarqueAction(selectedTheme.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Thème supprimé")
      setDeleteThemeDialogOpen(false)
      fetchThemes()
    }

    setLoading(false)
  }

  // Statut handlers
  const handleCreateStatut = () => {
    setSelectedStatut(null)
    setStatutFormData({ code: "", libelle: "" })
    setStatutDialogOpen(true)
  }

  const handleEditStatut = (statut: StatutPartenaire) => {
    setSelectedStatut(statut)
    setStatutFormData({
      code: statut.code,
      libelle: statut.libelle,
    })
    setStatutDialogOpen(true)
  }

  const handleSubmitStatut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statutFormData.code || !statutFormData.libelle) {
      toast.error("Code et libellé sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedStatut) {
      const result = await updateStatutPartenaireAction({
        id: selectedStatut.id,
        ...statutFormData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Statut mis à jour")
        setStatutDialogOpen(false)
        fetchStatuts()
      }
    } else {
      const result = await createStatutPartenaireAction(statutFormData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Statut créé")
        setStatutDialogOpen(false)
        fetchStatuts()
      }
    }

    setLoading(false)
  }

  const handleDeleteStatut = async () => {
    if (!selectedStatut) return

    setLoading(true)
    const result = await deleteStatutPartenaireAction(selectedStatut.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Statut supprimé")
      setDeleteStatutDialogOpen(false)
      fetchStatuts()
    }

    setLoading(false)
  }

  const filteredPartenaires = React.useMemo(() => {
    if (!search) return partenaires
    const q = search.toLowerCase()
    return partenaires.filter(
      (p) => p.nom.toLowerCase().includes(q) || p.domaine.toLowerCase().includes(q)
    )
  }, [partenaires, search])

  const sectionTitles = {
    partenaires: "Partenaires Marque Blanche",
    themes: "Thèmes",
    statuts: "Statuts Partenaire",
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          {section && (
            <Link
              href="/parametres/marque-blanche"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="size-6" />
            {section ? sectionTitles[section] : "Marque Blanche"}
          </h1>
          {!section && (
            <p className="text-muted-foreground">
              Gérez les partenaires marque blanche, thèmes et statuts.
            </p>
          )}
        </div>
      </div>

      {/* Partenaires Section */}
      {(!section || section === "partenaires") && <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Partenaires Marque Blanche</CardTitle>
              <CardDescription>
                {partenaires.length} partenaire{partenaires.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleCreatePartenaire}>
                <Plus className="size-4 mr-2" />
                Nouveau partenaire
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPartenaires.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aucun partenaire marque blanche
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Thème</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartenaires.map((partenaire) => (
                  <TableRow key={partenaire.id}>
                    <TableCell className="font-medium">{partenaire.nom}</TableCell>
                    <TableCell>{partenaire.domaine}</TableCell>
                    <TableCell>
                      {themes.find((t) => t.id === partenaire.themeId)?.nom || "-"}
                    </TableCell>
                    <TableCell>
                      {statuts.find((s) => s.id === partenaire.statutId)?.libelle || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={partenaire.actif ? "default" : "secondary"}>
                        {partenaire.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPartenaire(partenaire)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPartenaire(partenaire)
                            setDeletePartenaireDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>}

      {/* Themes Section */}
      {(!section || section === "themes") && <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Thèmes</CardTitle>
              <CardDescription>
                {themes.length} thème{themes.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button onClick={handleCreateTheme}>
              <Plus className="size-4 mr-2" />
              Nouveau thème
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Aucun thème</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Couleur Primaire</TableHead>
                  <TableHead>Couleur Secondaire</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {themes.map((theme) => (
                  <TableRow key={theme.id}>
                    <TableCell className="font-medium">{theme.nom}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.couleurPrimaire }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {theme.couleurPrimaire}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.couleurSecondaire }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {theme.couleurSecondaire}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{theme.logoUrl ? "Oui" : "Non"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTheme(theme)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTheme(theme)
                            setDeleteThemeDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>}

      {/* Statuts Section */}
      {(!section || section === "statuts") && <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statuts Partenaire</CardTitle>
              <CardDescription>
                {statuts.length} statut{statuts.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button onClick={handleCreateStatut}>
              <Plus className="size-4 mr-2" />
              Nouveau statut
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statuts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Aucun statut</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuts.map((statut) => (
                  <TableRow key={statut.id}>
                    <TableCell className="font-medium">{statut.code}</TableCell>
                    <TableCell>{statut.libelle}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStatut(statut)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStatut(statut)
                            setDeleteStatutDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>}

      {/* Partenaire Dialog */}
      <Dialog open={partenaireDialogOpen} onOpenChange={setPartenaireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPartenaire ? "Modifier" : "Créer"} un partenaire
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du partenaire marque blanche.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPartenaire} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={partenaireFormData.nom}
                onChange={(e) =>
                  setPartenaireFormData({ ...partenaireFormData, nom: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domaine">Domaine *</Label>
              <Input
                id="domaine"
                value={partenaireFormData.domaine}
                onChange={(e) =>
                  setPartenaireFormData({ ...partenaireFormData, domaine: e.target.value })
                }
                placeholder="example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="themeId">Thème</Label>
              <Select
                value={partenaireFormData.themeId}
                onValueChange={(value) =>
                  setPartenaireFormData({ ...partenaireFormData, themeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statutId">Statut</Label>
              <Select
                value={partenaireFormData.statutId}
                onValueChange={(value) =>
                  setPartenaireFormData({ ...partenaireFormData, statutId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuts.map((statut) => (
                    <SelectItem key={statut.id} value={statut.id}>
                      {statut.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="actif"
                checked={partenaireFormData.actif}
                onCheckedChange={(checked) =>
                  setPartenaireFormData({
                    ...partenaireFormData,
                    actif: checked === true,
                  })
                }
              />
              <Label htmlFor="actif">Actif</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPartenaireDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedPartenaire ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Theme Dialog */}
      <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTheme ? "Modifier" : "Créer"} un thème</DialogTitle>
            <DialogDescription>
              Configurez les couleurs et le logo du thème.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTheme} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-nom">Nom *</Label>
              <Input
                id="theme-nom"
                value={themeFormData.nom}
                onChange={(e) =>
                  setThemeFormData({ ...themeFormData, nom: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="couleurPrimaire">Couleur Primaire</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="couleurPrimaire"
                  type="color"
                  value={themeFormData.couleurPrimaire}
                  onChange={(e) =>
                    setThemeFormData({ ...themeFormData, couleurPrimaire: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={themeFormData.couleurPrimaire}
                  onChange={(e) =>
                    setThemeFormData({ ...themeFormData, couleurPrimaire: e.target.value })
                  }
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="couleurSecondaire">Couleur Secondaire</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="couleurSecondaire"
                  type="color"
                  value={themeFormData.couleurSecondaire}
                  onChange={(e) =>
                    setThemeFormData({
                      ...themeFormData,
                      couleurSecondaire: e.target.value,
                    })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={themeFormData.couleurSecondaire}
                  onChange={(e) =>
                    setThemeFormData({
                      ...themeFormData,
                      couleurSecondaire: e.target.value,
                    })
                  }
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL du Logo</Label>
              <Input
                id="logoUrl"
                value={themeFormData.logoUrl}
                onChange={(e) =>
                  setThemeFormData({ ...themeFormData, logoUrl: e.target.value })
                }
                placeholder="https://example.com/logo.png"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setThemeDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedTheme ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Statut Dialog */}
      <Dialog open={statutDialogOpen} onOpenChange={setStatutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStatut ? "Modifier" : "Créer"} un statut</DialogTitle>
            <DialogDescription>
              Définissez le code et le libellé du statut partenaire.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStatut} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="statut-code">Code *</Label>
              <Input
                id="statut-code"
                value={statutFormData.code}
                onChange={(e) =>
                  setStatutFormData({ ...statutFormData, code: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statut-libelle">Libellé *</Label>
              <Input
                id="statut-libelle"
                value={statutFormData.libelle}
                onChange={(e) =>
                  setStatutFormData({ ...statutFormData, libelle: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatutDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedStatut ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Partenaire Dialog */}
      <AlertDialog
        open={deletePartenaireDialogOpen}
        onOpenChange={setDeletePartenaireDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le partenaire{" "}
              <strong>{selectedPartenaire?.nom}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartenaire} disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Theme Dialog */}
      <AlertDialog open={deleteThemeDialogOpen} onOpenChange={setDeleteThemeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le thème{" "}
              <strong>{selectedTheme?.nom}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTheme} disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Statut Dialog */}
      <AlertDialog open={deleteStatutDialogOpen} onOpenChange={setDeleteStatutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le statut{" "}
              <strong>{selectedStatut?.libelle}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStatut} disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

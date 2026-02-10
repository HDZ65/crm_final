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
    denomination: "",
    contactSupportEmail: "",
    telephone: "",
    siren: "",
    numeroTva: "",
    statutId: "",
  })
  const [deletePartenaireDialogOpen, setDeletePartenaireDialogOpen] = React.useState(false)

  // Themes state
  const [themes, setThemes] = React.useState<ThemeMarque[]>(initialThemes || [])
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false)
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeMarque | null>(null)
  const [themeFormData, setThemeFormData] = React.useState({
    logoUrl: "",
    couleurPrimaire: "#000000",
    couleurSecondaire: "#ffffff",
    faviconUrl: "",
  })
  const [deleteThemeDialogOpen, setDeleteThemeDialogOpen] = React.useState(false)

  // Statuts state
  const [statuts, setStatuts] = React.useState<StatutPartenaire[]>(initialStatuts || [])
  const [statutDialogOpen, setStatutDialogOpen] = React.useState(false)
  const [selectedStatut, setSelectedStatut] = React.useState<StatutPartenaire | null>(null)
  const [statutFormData, setStatutFormData] = React.useState({
    code: "",
    nom: "",
    description: "",
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
      denomination: "",
      contactSupportEmail: "",
      telephone: "",
      siren: "",
      numeroTva: "",
      statutId: "",
    })
    setPartenaireDialogOpen(true)
  }

  const handleEditPartenaire = (partenaire: PartenaireMarqueBlanche) => {
    setSelectedPartenaire(partenaire)
    setPartenaireFormData({
      denomination: partenaire.denomination,
      contactSupportEmail: partenaire.contactSupportEmail,
      telephone: partenaire.telephone,
      siren: partenaire.siren,
      numeroTva: partenaire.numeroTva,
      statutId: partenaire.statutId,
    })
    setPartenaireDialogOpen(true)
  }

  const handleSubmitPartenaire = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partenaireFormData.denomination || !partenaireFormData.contactSupportEmail) {
      toast.error("Dénomination et email de support sont obligatoires")
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
      logoUrl: "",
      couleurPrimaire: "#000000",
      couleurSecondaire: "#ffffff",
      faviconUrl: "",
    })
    setThemeDialogOpen(true)
  }

  const handleEditTheme = (theme: ThemeMarque) => {
    setSelectedTheme(theme)
    setThemeFormData({
      logoUrl: theme.logoUrl || "",
      couleurPrimaire: theme.couleurPrimaire,
      couleurSecondaire: theme.couleurSecondaire,
      faviconUrl: theme.faviconUrl || "",
    })
    setThemeDialogOpen(true)
  }

  const handleSubmitTheme = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!themeFormData.logoUrl) {
      toast.error("Logo URL est obligatoire")
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
    setStatutFormData({ code: "", nom: "", description: "" })
    setStatutDialogOpen(true)
  }

  const handleEditStatut = (statut: StatutPartenaire) => {
    setSelectedStatut(statut)
    setStatutFormData({
      code: statut.code,
      nom: statut.nom,
      description: statut.description,
    })
    setStatutDialogOpen(true)
  }

  const handleSubmitStatut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statutFormData.code || !statutFormData.nom) {
      toast.error("Code et nom sont obligatoires")
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
      (p) => p.denomination.toLowerCase().includes(q) || p.contactSupportEmail.toLowerCase().includes(q)
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
                   <TableHead>Dénomination</TableHead>
                   <TableHead>Email Support</TableHead>
                   <TableHead>SIREN</TableHead>
                   <TableHead>Téléphone</TableHead>
                   <TableHead>Statut</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredPartenaires.map((partenaire) => (
                   <TableRow key={partenaire.id}>
                     <TableCell className="font-medium">{partenaire.denomination}</TableCell>
                     <TableCell>{partenaire.contactSupportEmail}</TableCell>
                     <TableCell>{partenaire.siren}</TableCell>
                     <TableCell>{partenaire.telephone}</TableCell>
                     <TableCell>
                       {statuts.find((s) => s.id === partenaire.statutId)?.nom || "-"}
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
                   <TableHead>Logo</TableHead>
                   <TableHead>Couleur Primaire</TableHead>
                   <TableHead>Couleur Secondaire</TableHead>
                   <TableHead>Favicon</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {themes.map((theme) => (
                   <TableRow key={theme.id}>
                     <TableCell className="font-medium">{theme.logoUrl ? "✓" : "-"}</TableCell>
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
                     <TableCell>{theme.faviconUrl ? "✓" : "-"}</TableCell>
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
                   <TableHead>Nom</TableHead>
                   <TableHead>Description</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {statuts.map((statut) => (
                   <TableRow key={statut.id}>
                     <TableCell className="font-medium">{statut.code}</TableCell>
                     <TableCell>{statut.nom}</TableCell>
                     <TableCell>{statut.description}</TableCell>
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
               <Label htmlFor="denomination">Dénomination *</Label>
               <Input
                 id="denomination"
                 value={partenaireFormData.denomination}
                 onChange={(e) =>
                   setPartenaireFormData({ ...partenaireFormData, denomination: e.target.value })
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="contactSupportEmail">Email de support *</Label>
               <Input
                 id="contactSupportEmail"
                 type="email"
                 value={partenaireFormData.contactSupportEmail}
                 onChange={(e) =>
                   setPartenaireFormData({ ...partenaireFormData, contactSupportEmail: e.target.value })
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="siren">SIREN</Label>
               <Input
                 id="siren"
                 value={partenaireFormData.siren}
                 onChange={(e) =>
                   setPartenaireFormData({ ...partenaireFormData, siren: e.target.value })
                 }
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="numeroTva">Numéro TVA</Label>
               <Input
                 id="numeroTva"
                 value={partenaireFormData.numeroTva}
                 onChange={(e) =>
                   setPartenaireFormData({ ...partenaireFormData, numeroTva: e.target.value })
                 }
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="telephone">Téléphone</Label>
               <Input
                 id="telephone"
                 value={partenaireFormData.telephone}
                 onChange={(e) =>
                   setPartenaireFormData({ ...partenaireFormData, telephone: e.target.value })
                 }
               />
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
                       {statut.nom}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
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
               <Label htmlFor="logoUrl">URL du Logo *</Label>
               <Input
                 id="logoUrl"
                 value={themeFormData.logoUrl}
                 onChange={(e) =>
                   setThemeFormData({ ...themeFormData, logoUrl: e.target.value })
                 }
                 placeholder="https://example.com/logo.png"
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
               <Label htmlFor="faviconUrl">URL du Favicon</Label>
               <Input
                 id="faviconUrl"
                 value={themeFormData.faviconUrl}
                 onChange={(e) =>
                   setThemeFormData({ ...themeFormData, faviconUrl: e.target.value })
                 }
                 placeholder="https://example.com/favicon.ico"
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
               <Label htmlFor="statut-nom">Nom *</Label>
               <Input
                 id="statut-nom"
                 value={statutFormData.nom}
                 onChange={(e) =>
                   setStatutFormData({ ...statutFormData, nom: e.target.value })
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="statut-description">Description</Label>
               <Input
                 id="statut-description"
                 value={statutFormData.description}
                 onChange={(e) =>
                   setStatutFormData({ ...statutFormData, description: e.target.value })
                 }
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
               <strong>{selectedPartenaire?.denomination}</strong> ? Cette action est irréversible.
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
               Êtes-vous sûr de vouloir supprimer ce thème ? Cette action est irréversible.
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
               <strong>{selectedStatut?.nom}</strong> ? Cette action est irréversible.
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

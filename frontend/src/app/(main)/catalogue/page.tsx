"use client"

import * as React from "react"
import { useProduits, useCreateProduit, useUpdateProduit, useGammes, useCreateGamme } from "@/hooks/catalogue"
import { useGroupeEntites, useCreateSociete } from "@/hooks/clients/use-groupe-entites"
import { useOrganisation } from "@/contexts/organisation-context"
import type { Product, CreateProduitDto, UpdateProduitDto } from "@/types/product"
import type { Gamme, CreateGammeDto } from "@/types/gamme"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import {
  Plus,
  Search,
  Package,
  Euro,
  Tag,
  Building2,
  Calendar,
  X,
  Loader2,
  Layers,
  ChevronRight,
  Percent,
  Copy,
} from "lucide-react"

// Dialogs
import { CreateProductDialog } from "@/components/catalogue/create-product-dialog"
import { EditProductDialog } from "@/components/catalogue/edit-product-dialog"

const statusConfig: Record<string, { label: string; className: string }> = {
  Disponible: { label: "Disponible", className: "bg-green-100 text-green-700" },
  Rupture: { label: "Rupture", className: "bg-red-100 text-red-700" },
  "Sur commande": { label: "Sur commande", className: "bg-amber-100 text-amber-700" },
  Archivé: { label: "Archivé", className: "bg-gray-100 text-gray-600" },
}

export default function CataloguePage() {
  const { activeOrganisation } = useOrganisation()
  const { societes, loading: societesLoading, refetch: refetchSocietes } = useGroupeEntites(activeOrganisation?.id)

  // State - "all" selected by default to show all products
  const [selectedSocieteId, setSelectedSocieteId] = React.useState<string | null>("all")
  const [selectedGammeId, setSelectedGammeId] = React.useState<string | null>("all")
  const [societeSearchQuery, setSocieteSearchQuery] = React.useState("")
  const [gammeSearchQuery, setGammeSearchQuery] = React.useState("")
  const [productSearchQuery, setProductSearchQuery] = React.useState("")
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null)
  const [isCreateSocieteDialogOpen, setIsCreateSocieteDialogOpen] = React.useState(false)
  const [isCreateGammeDialogOpen, setIsCreateGammeDialogOpen] = React.useState(false)
  const [newSocieteForm, setNewSocieteForm] = React.useState({
    raisonSociale: "",
    siren: "",
    numeroTVA: "",
  })
  const [newGammeForm, setNewGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })

  // Data fetching - "all" means fetch all
  const { gammes, loading: gammesLoading, refetch: refetchGammes } = useGammes(
    selectedSocieteId === "all"
      ? { fetchAll: true }
      : selectedSocieteId
        ? { societeId: selectedSocieteId }
        : undefined
  )
  const { produits, loading: produitsLoading, refetch } = useProduits(
    selectedSocieteId === "all"
      ? { fetchAll: true }
      : selectedGammeId === "all" && selectedSocieteId
        ? { societeId: selectedSocieteId }
        : selectedGammeId && selectedGammeId !== "all"
          ? { gammeId: selectedGammeId }
          : undefined
  )
  const { createProduit, loading: createLoading } = useCreateProduit()
  const { updateProduit, loading: updateLoading } = useUpdateProduit()
  const { createSociete, loading: createSocieteLoading } = useCreateSociete()
  const { createGamme, loading: createGammeLoading } = useCreateGamme()

  // Get selected gamme info
  const selectedGamme = React.useMemo(() => {
    return gammes.find((g) => g.id === selectedGammeId) || null
  }, [gammes, selectedGammeId])

  // Filter societes by search
  const filteredSocietes = React.useMemo(() => {
    if (!societeSearchQuery) return societes
    const query = societeSearchQuery.toLowerCase()
    return societes.filter((s) =>
      s.raisonSociale.toLowerCase().includes(query) ||
      s.siren.toLowerCase().includes(query)
    )
  }, [societes, societeSearchQuery])

  // Filter gammes by search
  const filteredGammes = React.useMemo(() => {
    if (!gammeSearchQuery) return gammes
    const query = gammeSearchQuery.toLowerCase()
    return gammes.filter((g) =>
      g.name.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query)
    )
  }, [gammes, gammeSearchQuery])

  // Filter products by search
  const filteredProducts = React.useMemo(() => {
    if (!selectedGammeId) return []
    let result = produits

    if (productSearchQuery) {
      const query = productSearchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [produits, selectedGammeId, productSearchQuery])

  // Check if we can create (need a specific selection, not "all" for products)
  const canCreateGamme = !!selectedSocieteId // Peut créer une gamme même avec "all" (on choisit la société dans la modale)
  const canCreateProduct = selectedGammeId && selectedGammeId !== "all"

  // Reset selections and search when société changes - select "all" by default
  React.useEffect(() => {
    if (selectedSocieteId) {
      setSelectedGammeId("all")
    } else {
      setSelectedGammeId(null)
    }
    setGammeSearchQuery("")
    setProductSearchQuery("")
  }, [selectedSocieteId])

  // Reset product search when gamme changes
  React.useEffect(() => {
    setProductSearchQuery("")
  }, [selectedGammeId])

  // Handlers
  const handleCreateProduct = async (data: CreateProduitDto) => {
    try {
      await createProduit(data)
      toast.success("Produit créé avec succès")
      setIsCreateDialogOpen(false)
      refetch()
    } catch {
      toast.error("Erreur lors de la création du produit")
    }
  }

  const handleUpdateProduct = async (id: string, data: UpdateProduitDto) => {
    try {
      const updated = await updateProduit(id, data)
      toast.success("Produit mis à jour avec succès")
      setIsEditDialogOpen(false)
      setProductToEdit(null)
      setSelectedProduct(null)
      refetch()
      // Update selected product if it was being viewed
      if (updated && selectedProduct?.id === id) {
        setSelectedProduct(updated)
      }
    } catch {
      toast.error("Erreur lors de la mise à jour du produit")
    }
  }

  const handleOpenEditDialog = (product: Product) => {
    setProductToEdit(product)
    setIsEditDialogOpen(true)
  }

  const handleCreateSociete = async () => {
    const { raisonSociale, siren, numeroTVA } = newSocieteForm
    if (!raisonSociale.trim() || !siren.trim() || !numeroTVA.trim() || !activeOrganisation?.id) return

    try {
      const newSociete = await createSociete({
        organisationId: activeOrganisation.id,
        raisonSociale: raisonSociale.trim(),
        siren: siren.trim(),
        numeroTVA: numeroTVA.trim(),
      })
      if (newSociete) {
        toast.success("Société créée avec succès")
        setIsCreateSocieteDialogOpen(false)
        setNewSocieteForm({ raisonSociale: "", siren: "", numeroTVA: "" })
        await refetchSocietes()
        setSelectedSocieteId(newSociete.id)
      }
    } catch {
      toast.error("Erreur lors de la création de la société")
    }
  }

  const handleCreateGamme = async () => {
    const { societeId: formSocieteId, nom, description } = newGammeForm
    // Utiliser la société du formulaire si "all" est sélectionné, sinon la société sélectionnée
    const targetSocieteId = selectedSocieteId === "all" ? formSocieteId : selectedSocieteId
    if (!nom.trim() || !targetSocieteId) return

    try {
      const newGamme = await createGamme({
        societeId: targetSocieteId,
        nom: nom.trim(),
        description: description.trim() || undefined,
        actif: true,
      })
      if (newGamme) {
        toast.success("Gamme créée avec succès")
        setIsCreateGammeDialogOpen(false)
        setNewGammeForm({ societeId: "", nom: "", description: "" })
        await refetchGammes()
        setSelectedGammeId(newGamme.id)
      }
    } catch {
      toast.error("Erreur lors de la création de la gamme")
    }
  }

  const isCreateSocieteFormValid =
    newSocieteForm.raisonSociale.trim() !== "" &&
    newSocieteForm.siren.trim() !== "" &&
    newSocieteForm.numeroTVA.trim() !== ""

  const isCreateGammeFormValid =
    newGammeForm.nom.trim() !== "" &&
    (selectedSocieteId !== "all" || newGammeForm.societeId !== "")

  const loading = societesLoading || produitsLoading || gammesLoading

  return (
    <main className="flex flex-1 flex-col min-h-0">
      {/* 3 Column Layout */}
      <Card className="flex-1 min-h-0 bg-card border-border flex flex-col overflow-hidden">
        <CardContent className="flex-1 min-h-0 p-0 grid grid-cols-3 divide-x">
          {/* Column 1: Sociétés */}
          <div className="flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-medium">Sociétés</h2>
                  {societes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filteredSocietes.length}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  onClick={() => setIsCreateSocieteDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">Nouvelle</span>
                </Button>
              </div>
              {societes.length > 0 && (
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={societeSearchQuery}
                    onChange={(e) => setSocieteSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {societesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : societes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className=" text-muted-foreground">Aucune société</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setIsCreateSocieteDialogOpen(true)}
                    >
                      Créer une société
                    </Button>
                  </div>
                ) : filteredSocietes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Aucun résultat</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Option "Toutes les sociétés" */}
                    <button
                      onClick={() => setSelectedSocieteId("all")}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm font-medium",
                        selectedSocieteId === "all"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <span>Toutes les sociétés</span>
                      {selectedSocieteId === "all" && (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                    <Separator className="my-1" />
                    {filteredSocietes.map((societe) => (
                      <button
                        key={societe.id}
                        onClick={() => setSelectedSocieteId(societe.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md  text-left transition-colors text-sm",
                          selectedSocieteId === societe.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="truncate">{societe.raisonSociale}</span>
                        {selectedSocieteId === societe.id && (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 2: Gammes */}
          <div className="flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-medium ">Gammes</h2>
                  {selectedSocieteId && gammes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filteredGammes.length}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  onClick={() => setIsCreateGammeDialogOpen(true)}
                  disabled={!canCreateGamme}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">Nouvelle</span>
                </Button>
              </div>
              {selectedSocieteId && gammes.length > 0 && (
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={gammeSearchQuery}
                    onChange={(e) => setGammeSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {!selectedSocieteId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className=" text-muted-foreground">
                      Sélectionnez une société
                    </p>
                  </div>
                ) : gammesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : gammes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className=" text-muted-foreground">
                      Aucune gamme
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setIsCreateGammeDialogOpen(true)}
                    >
                      Créer une gamme
                    </Button>
                  </div>
                ) : filteredGammes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Aucun résultat</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Option "Toutes les gammes" */}
                    <button
                      onClick={() => setSelectedGammeId("all")}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm font-medium",
                        selectedGammeId === "all"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <span>Toutes les gammes</span>
                      {selectedGammeId === "all" && (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                    <Separator className="my-1" />
                    {filteredGammes.map((gamme) => (
                      <button
                        key={gamme.id}
                        onClick={() => setSelectedGammeId(gamme.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm",
                          selectedGammeId === gamme.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="truncate">{gamme.name}</span>
                        {selectedGammeId === gamme.id && (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 3: Produits */}
          <div className="flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-medium ">Produits</h2>
                  {selectedGammeId && (
                    <Badge variant="secondary" className="text-xs">
                      {filteredProducts.length}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={!canCreateProduct}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">Nouveau</span>
                </Button>
              </div>
              {selectedGammeId && (
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {!selectedGammeId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className=" text-muted-foreground">
                      Sélectionnez une gamme
                    </p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    {productSearchQuery ? (
                      <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    )}
                    <p className=" text-muted-foreground">
                      {productSearchQuery ? "Aucun résultat" : "Aucun produit"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Product Detail Sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          {selectedProduct && (
            <ProductDetail
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onEdit={() => handleOpenEditDialog(selectedProduct)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create Product Dialog */}
      <CreateProductDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateProduct}
        societes={societes}
        gammes={gammes}
        loading={createLoading}
        defaultSocieteId={selectedSocieteId && selectedSocieteId !== "all" ? selectedSocieteId : undefined}
        defaultGammeId={selectedGammeId && selectedGammeId !== "all" ? selectedGammeId : undefined}
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateProduct}
        product={productToEdit}
        societes={societes}
        loading={updateLoading}
      />

      {/* Create Société Dialog */}
      <Dialog open={isCreateSocieteDialogOpen} onOpenChange={setIsCreateSocieteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une société</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle société pour organiser vos produits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="societe-raison-sociale">Raison sociale *</Label>
              <Input
                id="societe-raison-sociale"
                placeholder="Nom de la société"
                value={newSocieteForm.raisonSociale}
                onChange={(e) =>
                  setNewSocieteForm((prev) => ({ ...prev, raisonSociale: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="societe-siren">SIREN *</Label>
              <Input
                id="societe-siren"
                placeholder="123 456 789"
                value={newSocieteForm.siren}
                onChange={(e) =>
                  setNewSocieteForm((prev) => ({ ...prev, siren: e.target.value }))
                }
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">9 chiffres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="societe-tva">Numéro de TVA *</Label>
              <Input
                id="societe-tva"
                placeholder="FR12345678901"
                value={newSocieteForm.numeroTVA}
                onChange={(e) =>
                  setNewSocieteForm((prev) => ({ ...prev, numeroTVA: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">Format : FR + 11 chiffres</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateSocieteDialogOpen(false)
                setNewSocieteForm({ raisonSociale: "", siren: "", numeroTVA: "" })
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateSociete}
              disabled={!isCreateSocieteFormValid || createSocieteLoading}
            >
              {createSocieteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Gamme Dialog */}
      <Dialog open={isCreateGammeDialogOpen} onOpenChange={setIsCreateGammeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une gamme</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle gamme de produits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Sélecteur de société si "Toutes les sociétés" est sélectionné */}
            {selectedSocieteId === "all" && (
              <div className="space-y-2">
                <Label htmlFor="gamme-societe">Société *</Label>
                <select
                  id="gamme-societe"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={newGammeForm.societeId}
                  onChange={(e) =>
                    setNewGammeForm((prev) => ({ ...prev, societeId: e.target.value }))
                  }
                >
                  <option value="">Sélectionner une société</option>
                  {societes.map((societe) => (
                    <option key={societe.id} value={societe.id}>
                      {societe.raisonSociale}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="gamme-nom">Nom de la gamme *</Label>
              <Input
                id="gamme-nom"
                placeholder="Ex: Santé, Obsèque, Dépendance..."
                value={newGammeForm.nom}
                onChange={(e) =>
                  setNewGammeForm((prev) => ({ ...prev, nom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gamme-description">Description</Label>
              <Input
                id="gamme-description"
                placeholder="Description de la gamme (optionnel)"
                value={newGammeForm.description}
                onChange={(e) =>
                  setNewGammeForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateGammeDialogOpen(false)
                setNewGammeForm({ societeId: "", nom: "", description: "" })
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateGamme}
              disabled={!isCreateGammeFormValid || createGammeLoading}
            >
              {createGammeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

// Product Card Component
function ProductCard({
  product,
  onClick,
}: {
  product: Product
  onClick: () => void
}) {
  const status = statusConfig[product.status] || statusConfig.Disponible

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        product.promotionActive && "ring-2 ring-green-500/50 border-green-500/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{product.name}</h3>
              {product.promotionActive && (
                <Badge className="bg-green-500 text-white text-xs shrink-0">
                  -{product.promotionPourcentage}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{product.sku}</p>
          </div>
          <Badge variant="secondary" className={cn("shrink-0 text-xs", status.className)}>
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Euro className="h-3.5 w-3.5 text-muted-foreground" />
            {product.promotionActive && product.prixPromo ? (
              <>
                <span className="text-muted-foreground line-through text-sm">{product.price.toFixed(2)}</span>
                <span className="font-semibold text-green-600">{product.prixPromo.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-semibold">{product.price.toFixed(2)}</span>
            )}
            <span className="text-xs text-muted-foreground">/ mois</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {product.type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Product Detail Component
function ProductDetail({
  product,
  onClose,
  onEdit,
}: {
  product: Product
  onClose: () => void
  onEdit: () => void
}) {
  const status = statusConfig[product.status] || statusConfig.Disponible

  const handleCopyInfo = async () => {
    const info = `${product.name}
Référence: ${product.sku}
Prix HT: ${product.price.toFixed(2)} €
TVA: ${product.taxRate}%
Prix TTC: ${product.priceTTC.toFixed(2)} €
Type: ${product.type}
Catégorie: ${product.category}
${product.description ? `Description: ${product.description}` : ""}
${product.supplier ? `Fournisseur: ${product.supplier}` : ""}`

    try {
      await navigator.clipboard.writeText(info.trim())
      toast.success("Informations copiées")
    } catch {
      toast.error("Erreur lors de la copie")
    }
  }

  return (
    <>
      <SheetHeader className="p-6 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <SheetTitle className="text-xl">{product.name}</SheetTitle>
            <p className=" text-muted-foreground mt-1">{product.sku}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Promotion Banner */}
          {product.promotionActive && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">PROMO</Badge>
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    -{product.promotionPourcentage}% de réduction
                  </span>
                </div>
              </div>
              {(product.promotionDateDebut || product.promotionDateFin) && (
                <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                  {product.promotionDateDebut && product.promotionDateFin
                    ? `Du ${new Date(product.promotionDateDebut).toLocaleDateString("fr-FR")} au ${new Date(product.promotionDateFin).toLocaleDateString("fr-FR")}`
                    : product.promotionDateDebut
                      ? `À partir du ${new Date(product.promotionDateDebut).toLocaleDateString("fr-FR")}`
                      : `Jusqu'au ${new Date(product.promotionDateFin!).toLocaleDateString("fr-FR")}`}
                </p>
              )}
            </div>
          )}

          {/* Price */}
          <div className={cn(
            "p-4 rounded-lg border space-y-2",
            product.promotionActive
              ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
              : "bg-primary/5 border-primary/20"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix HT</span>
              {product.promotionActive && product.prixPromo ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{product.price.toFixed(2)} €</span>
                  <span className="font-medium text-green-600">{product.prixPromo.toFixed(2)} €</span>
                </div>
              ) : (
                <span className="font-medium">{product.price.toFixed(2)} €</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">TVA ({product.taxRate}%)</span>
              <span className="font-medium">
                {((product.promotionActive && product.prixPromo ? product.prixPromo : product.price) * product.taxRate / 100).toFixed(2)} €
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Prix TTC / mois</span>
              {product.promotionActive && product.prixPromoTTC ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{product.priceTTC.toFixed(2)} €</span>
                  <span className="text-xl font-bold text-green-600">
                    {product.prixPromoTTC.toFixed(2)} €
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-primary">
                  {product.priceTTC.toFixed(2)} €
                </span>
              )}
            </div>
          </div>

          {/* Status & Type */}
          <div className="flex flex-wrap gap-2">
            <Badge className={cn(status.className)}>{status.label}</Badge>
            <Badge variant="outline">{product.type}</Badge>
            <Badge variant="outline">{product.category}</Badge>
          </div>

          {/* Description */}
          <div>
            <h4 className=" font-medium mb-2">Description</h4>
            <p className=" text-muted-foreground">
              {product.description || "Aucune description disponible"}
            </p>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3">
            <h4 className=" font-medium">Informations</h4>

            <DetailRow icon={Tag} label="Référence" value={product.sku} />
            <DetailRow icon={Package} label="Catégorie" value={product.category || "Non définie"} />
            <DetailRow icon={Percent} label="Taux TVA" value={`${product.taxRate}%`} />
            {product.supplier && (
              <DetailRow icon={Building2} label="Fournisseur" value={product.supplier} />
            )}
            {product.createdAt && (
              <DetailRow
                icon={Calendar}
                label="Créé le"
                value={new Date(product.createdAt).toLocaleDateString("fr-FR")}
              />
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className=" font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-6 border-t space-y-2">
        <Button className="w-full" onClick={handleCopyInfo}>
          <Copy className="mr-2 h-4 w-4" />
          Copier les infos
        </Button>
        <Button variant="outline" className="w-full" onClick={onEdit}>
          Modifier
        </Button>
      </div>
    </>
  )
}

// Detail Row Component
function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className=" font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

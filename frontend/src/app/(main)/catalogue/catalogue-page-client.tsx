"use client"

import * as React from "react"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocieteStore } from "@/stores/societe-store"
import {
  TypeProduit,
  CategorieProduit,
  type Produit,
  type CreateProduitRequest,
  type UpdateProduitRequest,
  type Gamme,
} from "@proto/products/products"
import { TYPE_PRODUIT_LABELS, CATEGORIE_PRODUIT_LABELS } from "@/lib/ui/labels/product"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getGammesByOrganisation,
  createGamme as createGammeAction,
  updateGamme as updateGammeAction,
  getProduitsByOrganisation,
  createProduit as createProduitAction,
  updateProduit as updateProduitAction,
  getSocietesByOrganisation,
  syncCatalogue,
} from "@/actions/catalogue"
import type { Societe } from "@proto/organisations/organisations"

interface CataloguePageClientProps {
  initialSocietes?: Societe[] | null
  initialGammes?: Gamme[] | null
  initialProduits?: Produit[] | null
}

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Layers,
  ChevronRight,
  Percent,
  Copy,
  Edit,
  RefreshCw,
  Loader2,
} from "lucide-react"
// Note: Building2 kept for product detail fournisseur

// Dialogs
import { CreateProductDialog } from "@/components/catalogue/create-product-dialog"
import { EditProductDialog } from "@/components/catalogue/edit-product-dialog"

const statusConfig: Record<string, { label: string; className: string }> = {
  Disponible: { label: "Disponible", className: "bg-green-100 text-green-700" },
  Rupture: { label: "Rupture", className: "bg-red-100 text-red-700" },
  "Sur commande": { label: "Sur commande", className: "bg-amber-100 text-amber-700" },
  Archivé: { label: "Archivé", className: "bg-gray-100 text-gray-600" },
}

/** Derive a display status from the proto `actif` field */
function getStatusLabel(produit: Produit): string {
  return produit.actif ? "Disponible" : "Archivé"
}

/** Compute TTC price */
function computePrixTTC(prixHT: number, tauxTva: number): number {
  return prixHT * (1 + tauxTva / 100)
}

/** Compute promotion percentage */
function computePromotionPourcentage(produit: Produit): number | undefined {
  if (produit.promotionActive && produit.prixPromotion && produit.prix > 0) {
    return Math.round((1 - produit.prixPromotion / produit.prix) * 100)
  }
  return undefined
}

export function CataloguePageClient({
  initialSocietes,
  initialGammes,
  initialProduits,
}: CataloguePageClientProps) {
  const { activeOrganisation } = useOrganisation()

  // Société active depuis le store global (sélection via sidebar)
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId)

  // Refs to track initial fetch
  const hasFetchedSocietes = React.useRef(!!initialSocietes)
  const hasFetchedGammes = React.useRef(!!initialGammes)
  const hasFetchedProduits = React.useRef(!!initialProduits)

  // Data state - initialize with SSR data if available
  const [societes, setSocietes] = React.useState<Societe[]>(
    initialSocietes ?? []
  )
  const [gammes, setGammes] = React.useState<Gamme[]>(
    initialGammes ?? []
  )
  const [produits, setProduits] = React.useState<Produit[]>(
    initialProduits ?? []
  )
  const [gammesLoading, setGammesLoading] = React.useState(!initialGammes)
  const [produitsLoading, setProduitsLoading] = React.useState(!initialProduits)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [updateLoading, setUpdateLoading] = React.useState(false)
  const [createGammeLoading, setCreateGammeLoading] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)

  // State - "all" selected by default for gammes to show all products
  const [selectedGammeId, setSelectedGammeId] = React.useState<string | null>("all")
  const [gammeSearchQuery, setGammeSearchQuery] = React.useState("")
  const [productSearchQuery, setProductSearchQuery] = React.useState("")
  const [selectedProduct, setSelectedProduct] = React.useState<Produit | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [productToEdit, setProductToEdit] = React.useState<Produit | null>(null)
  const [isCreateGammeDialogOpen, setIsCreateGammeDialogOpen] = React.useState(false)
  const [newGammeForm, setNewGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })

  // Edit Gamme state
  const [isEditGammeDialogOpen, setIsEditGammeDialogOpen] = React.useState(false)
  const [gammeToEdit, setGammeToEdit] = React.useState<Gamme | null>(null)
  const [editGammeForm, setEditGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })
  const [updateGammeLoading, setUpdateGammeLoading] = React.useState(false)

  // Fetch societes
  const fetchSocietes = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    const result = await getSocietesByOrganisation(activeOrganisation.organisationId)
    if (result.data?.societes) {
      setSocietes(result.data.societes)
    }
  }, [activeOrganisation?.organisationId])

   // Fetch gammes
   const fetchGammes = React.useCallback(async () => {
     if (!activeOrganisation?.organisationId) return
     setGammesLoading(true)
     const result = await getGammesByOrganisation({
       organisationId: activeOrganisation.organisationId,
       societeId: activeSocieteId || undefined,
     })
     if (result.data?.gammes) {
       setGammes(result.data.gammes)
     }
     setGammesLoading(false)
   }, [activeOrganisation?.organisationId, activeSocieteId])

  // Fetch produits
  const fetchProduits = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    setProduitsLoading(true)
    const result = await getProduitsByOrganisation({
      organisationId: activeOrganisation.organisationId,
      gammeId: selectedGammeId && selectedGammeId !== "all" ? selectedGammeId : undefined,
    })
    if (result.data?.produits) {
      setProduits(result.data.produits)
    }
    setProduitsLoading(false)
  }, [activeOrganisation?.organisationId, selectedGammeId])

  // Refetch functions (for use after mutations)
  const refetchGammes = React.useCallback(() => {
    fetchGammes()
  }, [fetchGammes])

  const refetch = React.useCallback(() => {
    fetchProduits()
  }, [fetchProduits])

  // Initial data fetching - skip if SSR data provided
  React.useEffect(() => {
    if (hasFetchedSocietes.current) return
    hasFetchedSocietes.current = true
    fetchSocietes()
  }, [fetchSocietes])

  React.useEffect(() => {
    if (hasFetchedGammes.current) return
    hasFetchedGammes.current = true
    fetchGammes()
  }, [fetchGammes])

  React.useEffect(() => {
    if (hasFetchedProduits.current) return
    hasFetchedProduits.current = true
    fetchProduits()
  }, [fetchProduits])

  // Get selected gamme info
  const selectedGamme = React.useMemo(() => {
    return gammes.find((g) => g.id === selectedGammeId) || null
  }, [gammes, selectedGammeId])

  // Filter gammes by search
  const filteredGammes = React.useMemo(() => {
    if (!gammeSearchQuery) return gammes
    const query = gammeSearchQuery.toLowerCase()
    return gammes.filter((g) =>
      g.nom.toLowerCase().includes(query) ||
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
          p.nom.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [produits, selectedGammeId, productSearchQuery])

  // Check if we can create (need a specific selection for products)
  // Peut créer une gamme si une société spécifique est sélectionnée, ou si "toutes" on choisira dans la modale
  const canCreateGamme = true
  const canCreateProduct = selectedGammeId && selectedGammeId !== "all"

    // Reset selections and refetch when société changes
    React.useEffect(() => {
      setSelectedGammeId("all")
      setGammeSearchQuery("")
      setProductSearchQuery("")
      fetchGammes()
      fetchProduits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSocieteId])

   // Reset product search when gamme changes
   React.useEffect(() => {
     setProductSearchQuery("")
   }, [selectedGammeId])

   // Refetch products when gamme selection changes (skip initial render)
   const isInitialGammeSelection = React.useRef(true)
   React.useEffect(() => {
     if (isInitialGammeSelection.current) {
       isInitialGammeSelection.current = false
       return
     }
     fetchProduits()
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedGammeId])

  // Handlers
  const handleCreateProduct = async (data: CreateProduitRequest) => {
    if (!activeOrganisation?.organisationId) return
    setCreateLoading(true)

    const result = await createProduitAction({
      ...data,
      organisationId: activeOrganisation.organisationId,
    })

    setCreateLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Produit créé avec succès")
      setIsCreateDialogOpen(false)
      refetch()
    }
  }

  const handleUpdateProduct = async (id: string, data: UpdateProduitRequest) => {
    setUpdateLoading(true)

    const result = await updateProduitAction({
      ...data,
      id,
    })

    setUpdateLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Produit mis à jour avec succès")
      setIsEditDialogOpen(false)
      setProductToEdit(null)
      setSelectedProduct(null)
      refetch()
      // Update selected product if it was being viewed
      if (result.data && selectedProduct?.id === id) {
        setSelectedProduct(result.data)
      }
    }
  }

  const handleOpenEditDialog = (product: Produit) => {
    setProductToEdit(product)
    setIsEditDialogOpen(true)
  }

   const handleCreateGamme = async () => {
     if (!activeOrganisation?.organisationId) return
     const { nom, description } = newGammeForm
     if (!nom.trim()) return

     setCreateGammeLoading(true)

     const societeIdValue = newGammeForm.societeId && newGammeForm.societeId !== "none" ? newGammeForm.societeId : undefined
     const result = await createGammeAction({
       organisationId: activeOrganisation.organisationId,
       societeId: societeIdValue,
       nom: nom.trim(),
       description: description.trim() || undefined,
     })

    setCreateGammeLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      toast.success("Gamme créée avec succès")
      setIsCreateGammeDialogOpen(false)
      setNewGammeForm({ societeId: "", nom: "", description: "" })
      await refetchGammes()
      setSelectedGammeId(result.data.id)
    }
  }

   const handleOpenEditGamme = (gamme: Gamme) => {
     setGammeToEdit(gamme)
     setEditGammeForm({
       societeId: gamme.societeId || "",
       nom: gamme.nom,
       description: gamme.description || "",
     })
     setIsEditGammeDialogOpen(true)
   }

   const handleUpdateGamme = async () => {
     if (!gammeToEdit || !activeOrganisation?.organisationId) return
     const { nom, description, societeId } = editGammeForm
     if (!nom.trim()) return

     setUpdateGammeLoading(true)

     const societeIdValue = societeId && societeId !== "none" ? societeId : undefined
     const result = await updateGammeAction({
       id: gammeToEdit.id,
       societeId: societeIdValue,
       nom: nom.trim(),
       description: description.trim() || undefined,
     })

     setUpdateGammeLoading(false)

     if (result.error) {
       toast.error(result.error)
     } else if (result.data) {
       toast.success("Gamme mise à jour avec succès")
       setIsEditGammeDialogOpen(false)
       setGammeToEdit(null)
       await refetchGammes()
     }
   }

   const isCreateGammeFormValid =
     newGammeForm.nom.trim() !== "" && activeOrganisation?.organisationId

   const loading = produitsLoading || gammesLoading

  return (
    <main className="flex flex-1 flex-col min-h-0 gap-4">

      {/* 2 Column Layout - La sélection de société se fait via la sidebar */}
      <Card className="flex-1 min-h-0 bg-card border-border flex flex-col overflow-hidden">
        <CardContent className="flex-1 min-h-0 p-0 grid grid-cols-[280px_1fr] divide-x">
          {/* Column 1: Gammes */}
          <div className="flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-medium">Gammes</h2>
                  {gammes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filteredGammes.length}
                    </Badge>
                  )}
                </div>
                 <Button
                   variant="outline"
                   size="sm"
                   className="h-7 gap-1"
                   onClick={() => {
                     setNewGammeForm({ societeId: activeSocieteId || "", nom: "", description: "" })
                     setIsCreateGammeDialogOpen(true)
                   }}
                   disabled={!canCreateGamme}
                 >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">Nouvelle</span>
                </Button>
              </div>
              {gammes.length > 0 && (
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filtrer les gammes..."
                    value={gammeSearchQuery}
                    onChange={(e) => setGammeSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {gammes.length === 0 ? (
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
                       type="button"
                       onClick={() => setSelectedGammeId("all")}
                       className={cn(
                         "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm",
                         selectedGammeId === "all"
                           ? "bg-muted font-medium text-foreground"
                           : "hover:bg-muted/50 text-muted-foreground"
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
                         type="button"
                         onClick={() => setSelectedGammeId(gamme.id)}
                         className={cn(
                           "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm group",
                           selectedGammeId === gamme.id
                             ? "bg-muted font-medium text-foreground"
                             : "hover:bg-muted/50"
                         )}
                       >
                         <span className="truncate capitalize">{gamme.nom.toLowerCase()}</span>
                         <div className="flex items-center gap-1 shrink-0">
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation()
                               handleOpenEditGamme(gamme)
                             }}
                             className="h-6 w-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
                           >
                             <Edit className="h-3 w-3" />
                           </button>
                           {selectedGammeId === gamme.id && (
                             <ChevronRight className="h-4 w-4" />
                           )}
                         </div>
                       </button>
                     ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 2: Produits */}
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
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={async () => {
                      if (!activeOrganisation?.organisationId || isSyncing) return
                      setIsSyncing(true)
                      try {
                        const result = await syncCatalogue({ organisationId: activeOrganisation.organisationId })
                        if (result.error) {
                          toast.error(result.error)
                        } else if (result.data) {
                          toast.success(`${result.data.productsSynced} produits synchronisés`)
                          refetch()
                        }
                      } catch {
                        toast.error("Erreur lors de la synchronisation")
                      } finally {
                        setIsSyncing(false)
                      }
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs">Synchroniser</span>
                  </Button>
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
              </div>
              {selectedGammeId && (
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Chercher un produit..."
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
                        onEdit={() => handleOpenEditDialog(product)}
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
        defaultSocieteId={activeSocieteId || undefined}
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
              <div className="space-y-2">
                <Label htmlFor="gamme-societe">Société</Label>
                <Select
                  value={newGammeForm.societeId}
                  onValueChange={(value) =>
                    setNewGammeForm((prev) => ({ ...prev, societeId: value }))
                  }
                >
                  <SelectTrigger id="gamme-societe">
                    <SelectValue placeholder="Aucune société" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune société</SelectItem>
                    {societes.map((societe) => (
                      <SelectItem key={societe.id} value={societe.id}>
                        {societe.raisonSociale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
               {createGammeLoading ? "Création..." : "Créer"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Edit Gamme Dialog */}
       <Dialog open={isEditGammeDialogOpen} onOpenChange={setIsEditGammeDialogOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Modifier la gamme</DialogTitle>
             <DialogDescription>
               Modifiez les informations de la gamme.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="edit-gamme-nom">Nom de la gamme *</Label>
               <Input
                 id="edit-gamme-nom"
                 placeholder="Ex: Santé, Obsèque, Dépendance..."
                 value={editGammeForm.nom}
                 onChange={(e) =>
                   setEditGammeForm((prev) => ({ ...prev, nom: e.target.value }))
                 }
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="edit-gamme-description">Description</Label>
               <Input
                 id="edit-gamme-description"
                 placeholder="Description de la gamme (optionnel)"
                 value={editGammeForm.description}
                 onChange={(e) =>
                   setEditGammeForm((prev) => ({ ...prev, description: e.target.value }))
                 }
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="edit-gamme-societe">Société</Label>
               <Select
                 value={editGammeForm.societeId || "none"}
                 onValueChange={(value) =>
                   setEditGammeForm((prev) => ({ ...prev, societeId: value }))
                 }
               >
                 <SelectTrigger id="edit-gamme-societe">
                   <SelectValue placeholder="Aucune société" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Aucune société</SelectItem>
                   {societes.map((societe) => (
                     <SelectItem key={societe.id} value={societe.id}>
                       {societe.raisonSociale}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
           <DialogFooter>
             <Button
               variant="outline"
               onClick={() => {
                 setIsEditGammeDialogOpen(false)
                 setGammeToEdit(null)
               }}
             >
               Annuler
             </Button>
             <Button
               onClick={handleUpdateGamme}
               disabled={!editGammeForm.nom.trim() || updateGammeLoading}
             >
               {updateGammeLoading ? "Enregistrement..." : "Enregistrer"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </main>
  )
}

// Capitalize first letter of each word
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Product Card Component
function ProductCard({
  product,
  onClick,
  onEdit,
}: {
  product: Produit
  onClick: () => void
  onEdit: () => void
}) {
  const statusLabel = getStatusLabel(product)
  const status = statusConfig[statusLabel] || statusConfig.Disponible
  const promoPct = computePromotionPourcentage(product)

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group",
        product.promotionActive && "ring-2 ring-green-500/50 border-green-500/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Name and promo */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{capitalizeWords(product.nom)}</h3>
              {product.promotionActive && promoPct != null && (
                <Badge className="bg-green-500 text-white text-xs shrink-0">
                  -{promoPct}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
              {product.categorie != null && (
                <span className="text-xs text-muted-foreground">• {CATEGORIE_PRODUIT_LABELS[product.categorie]}</span>
              )}
            </div>
          </div>

          {/* Center: Price */}
          <div className="flex items-center gap-1 shrink-0">
            <Euro className="h-3.5 w-3.5 text-muted-foreground" />
            {product.promotionActive && product.prixPromotion ? (
              <>
                <span className="text-muted-foreground line-through text-sm tabular-nums">{product.prix.toFixed(2)}</span>
                <span className="font-semibold text-green-600 tabular-nums">{product.prixPromotion.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-semibold tabular-nums">{product.prix.toFixed(2)}</span>
            )}
            <span className="text-xs text-muted-foreground">/ mois</span>
          </div>

          {/* Right: Badges and actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {TYPE_PRODUIT_LABELS[product.type]}
            </Badge>
            {/* Edit button - visible on hover */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            {/* Chevron always visible for click affordance */}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
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
  product: Produit
  onClose: () => void
  onEdit: () => void
}) {
  const statusLabel = getStatusLabel(product)
  const status = statusConfig[statusLabel] || statusConfig.Disponible
  const promoPct = computePromotionPourcentage(product)
  const prixTTC = computePrixTTC(product.prix, product.tauxTva)
  const prixPromoTTC = product.promotionActive && product.prixPromotion
    ? computePrixTTC(product.prixPromotion, product.tauxTva)
    : undefined

  const handleCopyInfo = async () => {
    const info = `${product.nom}
Référence: ${product.sku}
Prix HT: ${product.prix.toFixed(2)} \u20ac
TVA: ${product.tauxTva}%
Prix TTC: ${prixTTC.toFixed(2)} \u20ac
Type: ${TYPE_PRODUIT_LABELS[product.type]}
Catégorie: ${CATEGORIE_PRODUIT_LABELS[product.categorie]}
${product.description ? `Description: ${product.description}` : ""}`

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
            <SheetTitle className="text-xl">{product.nom}</SheetTitle>
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
                    -{promoPct}% de réduction
                  </span>
                </div>
              </div>
              {(product.dateDebutPromotion || product.dateFinPromotion) && (
                <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                  {product.dateDebutPromotion && product.dateFinPromotion
                    ? `Du ${new Date(product.dateDebutPromotion).toLocaleDateString("fr-FR")} au ${new Date(product.dateFinPromotion).toLocaleDateString("fr-FR")}`
                    : product.dateDebutPromotion
                      ? `À partir du ${new Date(product.dateDebutPromotion).toLocaleDateString("fr-FR")}`
                      : `Jusqu'au ${new Date(product.dateFinPromotion).toLocaleDateString("fr-FR")}`}
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
              {product.promotionActive && product.prixPromotion ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{product.prix.toFixed(2)} \u20ac</span>
                  <span className="font-medium text-green-600">{product.prixPromotion.toFixed(2)} \u20ac</span>
                </div>
              ) : (
                <span className="font-medium">{product.prix.toFixed(2)} \u20ac</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">TVA ({product.tauxTva}%)</span>
              <span className="font-medium">
                {((product.promotionActive && product.prixPromotion ? product.prixPromotion : product.prix) * product.tauxTva / 100).toFixed(2)} \u20ac
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Prix TTC / mois</span>
              {product.promotionActive && prixPromoTTC ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{prixTTC.toFixed(2)} \u20ac</span>
                  <span className="text-xl font-bold text-green-600">
                    {prixPromoTTC.toFixed(2)} \u20ac
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-primary">
                  {prixTTC.toFixed(2)} \u20ac
                </span>
              )}
            </div>
          </div>

          {/* Status & Type */}
          <div className="flex flex-wrap gap-2">
            <Badge className={cn(status.className)}>{status.label}</Badge>
            <Badge variant="outline">{TYPE_PRODUIT_LABELS[product.type]}</Badge>
            <Badge variant="outline">{CATEGORIE_PRODUIT_LABELS[product.categorie]}</Badge>
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
            <DetailRow icon={Package} label="Catégorie" value={CATEGORIE_PRODUIT_LABELS[product.categorie] || "Non définie"} />
            <DetailRow icon={Percent} label="Taux TVA" value={`${product.tauxTva}%`} />
            {product.createdAt && (
              <DetailRow
                icon={Calendar}
                label="Créé le"
                value={new Date(product.createdAt).toLocaleDateString("fr-FR")}
              />
            )}
          </div>
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

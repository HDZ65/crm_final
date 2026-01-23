"use client"

import * as React from "react"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocieteStore } from "@/stores/societe-store"
import type { Product, CreateProduitDto, UpdateProduitDto } from "@/types/product"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getGammesByOrganisation,
  createGamme as createGammeAction,
  getProduitsByOrganisation,
  createProduit as createProduitAction,
  updateProduit as updateProduitAction,
  getSocietesByOrganisation,
} from "@/actions/catalogue"
import type { Gamme as GrpcGamme, Produit as GrpcProduit, TypeProduit, CategorieProduit } from "@proto/products/products"

// Local enum values matching proto - avoids importing grpc runtime in client bundle
const TypeProduitValues = {
  TYPE_PRODUIT_UNSPECIFIED: 0,
  INTERNE: 1,
  PARTENAIRE: 2,
  UNRECOGNIZED: -1,
} as const

const CategorieProduitValues = {
  CATEGORIE_PRODUIT_UNSPECIFIED: 0,
  ASSURANCE: 1,
  PREVOYANCE: 2,
  EPARGNE: 3,
  SERVICE: 4,
  ACCESSOIRE: 5,
  UNRECOGNIZED: -1,
} as const
import type { Societe } from "@proto/organisations/organisations"
import type { Gamme } from "@/types/gamme"
import type { SocieteDto } from "@/types/societe"

interface CataloguePageClientProps {
  initialSocietes?: Societe[] | null
  initialGammes?: GrpcGamme[] | null
  initialProduits?: GrpcProduit[] | null
}

// Mapping functions
function mapGrpcGammeToGamme(grpc: GrpcGamme): Gamme {
  return {
    id: grpc.id,
    organisationId: grpc.organisationId,
    name: grpc.nom,
    description: grpc.description || undefined,
    icon: grpc.icone || undefined,
    active: grpc.actif,
    createdAt: grpc.createdAt,
    updatedAt: grpc.updatedAt,
  }
}

function mapSocieteToDto(societe: Societe): SocieteDto {
  return {
    id: societe.id,
    organisationId: societe.organisationId,
    raisonSociale: societe.raisonSociale,
    siren: societe.siren || "",
    numeroTVA: societe.numeroTva || "",
    createdAt: societe.createdAt,
    updatedAt: societe.updatedAt,
  }
}

function mapGrpcProduitToProduct(grpc: GrpcProduit): Product {
  const prixTTC = grpc.prix * (1 + grpc.tauxTva / 100)
  const prixPromoTTC = grpc.promotionActive && grpc.prixPromotion
    ? grpc.prixPromotion * (1 + grpc.tauxTva / 100)
    : undefined

  const typeMap: Record<TypeProduit, "Interne" | "Partenaire"> = {
    [TypeProduitValues.TYPE_PRODUIT_UNSPECIFIED]: "Interne",
    [TypeProduitValues.INTERNE]: "Interne",
    [TypeProduitValues.PARTENAIRE]: "Partenaire",
    [TypeProduitValues.UNRECOGNIZED]: "Interne",
  }

  const categoryMap: Record<CategorieProduit, string> = {
    [CategorieProduitValues.CATEGORIE_PRODUIT_UNSPECIFIED]: "Autre",
    [CategorieProduitValues.ASSURANCE]: "Assurance",
    [CategorieProduitValues.PREVOYANCE]: "Prévoyance",
    [CategorieProduitValues.EPARGNE]: "Épargne",
    [CategorieProduitValues.SERVICE]: "Service",
    [CategorieProduitValues.ACCESSOIRE]: "Accessoire",
    [CategorieProduitValues.UNRECOGNIZED]: "Autre",
  }

  // Calculate promotion percentage
  const promotionPourcentage = grpc.promotionActive && grpc.prixPromotion && grpc.prix > 0
    ? Math.round((1 - grpc.prixPromotion / grpc.prix) * 100)
    : undefined

  return {
    id: grpc.id,
    organisationId: grpc.organisationId,
    gammeId: grpc.gammeId || undefined,
    name: grpc.nom,
    description: grpc.description || "",
    type: typeMap[grpc.type as TypeProduit] || "Interne",
    category: categoryMap[grpc.categorie as CategorieProduit] || "Autre",
    status: grpc.actif ? "Disponible" : "Archivé",
    price: grpc.prix,
    taxRate: grpc.tauxTva,
    priceTTC: prixTTC,
    currency: grpc.devise || "EUR",
    sku: grpc.sku,
    actif: grpc.actif,
    promotionActive: grpc.promotionActive,
    promotionPrice: grpc.promotionActive ? grpc.prixPromotion : undefined,
    promotionPourcentage,
    prixPromo: grpc.promotionActive ? grpc.prixPromotion : undefined,
    prixPromoTTC,
    promotionDateDebut: grpc.dateDebutPromotion || undefined,
    promotionDateFin: grpc.dateFinPromotion || undefined,
    imageUrl: grpc.imageUrl || undefined,
    image: grpc.imageUrl || undefined,
    supplier: undefined,
    tags: [],
    createdAt: grpc.createdAt,
    updatedAt: grpc.updatedAt,
  }
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
  const [societes, setSocietes] = React.useState<SocieteDto[]>(
    initialSocietes ? initialSocietes.map(mapSocieteToDto) : []
  )
  const [gammes, setGammes] = React.useState<Gamme[]>(
    initialGammes ? initialGammes.map(mapGrpcGammeToGamme) : []
  )
  const [produits, setProduits] = React.useState<Product[]>(
    initialProduits ? initialProduits.map(mapGrpcProduitToProduct) : []
  )
  const [gammesLoading, setGammesLoading] = React.useState(!initialGammes)
  const [produitsLoading, setProduitsLoading] = React.useState(!initialProduits)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [updateLoading, setUpdateLoading] = React.useState(false)
  const [createGammeLoading, setCreateGammeLoading] = React.useState(false)

  // State - "all" selected by default for gammes to show all products
  const [selectedGammeId, setSelectedGammeId] = React.useState<string | null>("all")
  const [gammeSearchQuery, setGammeSearchQuery] = React.useState("")
  const [productSearchQuery, setProductSearchQuery] = React.useState("")
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null)
  const [isCreateGammeDialogOpen, setIsCreateGammeDialogOpen] = React.useState(false)
  const [newGammeForm, setNewGammeForm] = React.useState({
    societeId: "",
    nom: "",
    description: "",
  })

  // Fetch societes
  const fetchSocietes = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    const result = await getSocietesByOrganisation(activeOrganisation.organisationId)
    if (result.data?.societes) {
      setSocietes(result.data.societes.map(mapSocieteToDto))
    }
  }, [activeOrganisation?.organisationId])

  // Fetch gammes
  const fetchGammes = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    setGammesLoading(true)
    const result = await getGammesByOrganisation({
      organisationId: activeOrganisation.organisationId,
    })
    if (result.data?.gammes) {
      setGammes(result.data.gammes.map(mapGrpcGammeToGamme))
    }
    setGammesLoading(false)
  }, [activeOrganisation?.organisationId])

  // Fetch produits
  const fetchProduits = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    setProduitsLoading(true)
    const result = await getProduitsByOrganisation({
      organisationId: activeOrganisation.organisationId,
      gammeId: selectedGammeId && selectedGammeId !== "all" ? selectedGammeId : undefined,
    })
    if (result.data?.produits) {
      setProduits(result.data.produits.map(mapGrpcProduitToProduct))
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

  // Check if we can create (need a specific selection for products)
  // Peut créer une gamme si une société spécifique est sélectionnée, ou si "toutes" on choisira dans la modale
  const canCreateGamme = true
  const canCreateProduct = selectedGammeId && selectedGammeId !== "all"

  // Reset selections and search when société changes - select "all" by default
  React.useEffect(() => {
    setSelectedGammeId("all")
    setGammeSearchQuery("")
    setProductSearchQuery("")
  }, [activeSocieteId])

  // Reset product search when gamme changes
  React.useEffect(() => {
    setProductSearchQuery("")
  }, [selectedGammeId])

  // Handlers
  const handleCreateProduct = async (data: CreateProduitDto) => {
    if (!activeOrganisation?.organisationId) return
    setCreateLoading(true)

    const typeMap: Record<string, TypeProduit> = {
      Interne: TypeProduitValues.INTERNE as TypeProduit,
      Partenaire: TypeProduitValues.PARTENAIRE as TypeProduit,
    }

    const categoryMap: Record<string, CategorieProduit> = {
      Assurance: CategorieProduitValues.ASSURANCE as CategorieProduit,
      Prévoyance: CategorieProduitValues.PREVOYANCE as CategorieProduit,
      Épargne: CategorieProduitValues.EPARGNE as CategorieProduit,
      Service: CategorieProduitValues.SERVICE as CategorieProduit,
      Accessoire: CategorieProduitValues.ACCESSOIRE as CategorieProduit,
    }

    const result = await createProduitAction({
      organisationId: activeOrganisation.organisationId,
      gammeId: data.gammeId || "",
      nom: data.nom,
      sku: data.sku,
      description: data.description || "",
      type: typeMap[data.type] || (TypeProduitValues.INTERNE as TypeProduit),
      categorie: categoryMap[data.categorie || ""] || (CategorieProduitValues.ASSURANCE as CategorieProduit),
      prix: data.prix,
      tauxTva: data.tauxTva || 20,
      devise: data.devise || "EUR",
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

  const handleUpdateProduct = async (id: string, data: UpdateProduitDto) => {
    setUpdateLoading(true)

    const typeMap: Record<string, TypeProduit> = {
      Interne: TypeProduitValues.INTERNE as TypeProduit,
      Partenaire: TypeProduitValues.PARTENAIRE as TypeProduit,
    }

    const categoryMap: Record<string, CategorieProduit> = {
      Assurance: CategorieProduitValues.ASSURANCE as CategorieProduit,
      Prévoyance: CategorieProduitValues.PREVOYANCE as CategorieProduit,
      Épargne: CategorieProduitValues.EPARGNE as CategorieProduit,
      Service: CategorieProduitValues.SERVICE as CategorieProduit,
      Accessoire: CategorieProduitValues.ACCESSOIRE as CategorieProduit,
    }

    const result = await updateProduitAction({
      id,
      gammeId: data.gammeId,
      nom: data.nom,
      sku: data.sku,
      description: data.description,
      type: data.type ? typeMap[data.type] : undefined,
      categorie: data.categorie ? categoryMap[data.categorie] : undefined,
      prix: data.prix,
      tauxTva: data.tauxTva,
      devise: data.devise,
      actif: data.actif,
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
        setSelectedProduct(mapGrpcProduitToProduct(result.data))
      }
    }
  }

  const handleOpenEditDialog = (product: Product) => {
    setProductToEdit(product)
    setIsEditDialogOpen(true)
  }

  const handleCreateGamme = async () => {
    if (!activeOrganisation?.organisationId) return
    const { nom, description } = newGammeForm
    if (!nom.trim()) return

    setCreateGammeLoading(true)

    const result = await createGammeAction({
      organisationId: activeOrganisation.organisationId,
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

  const isCreateGammeFormValid =
    newGammeForm.nom.trim() !== "" && activeOrganisation?.organisationId

  const loading = produitsLoading || gammesLoading

  return (
    <main className="flex flex-1 flex-col min-h-0">
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
                  onClick={() => setIsCreateGammeDialogOpen(true)}
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
                        onClick={() => setSelectedGammeId(gamme.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm",
                          selectedGammeId === gamme.id
                            ? "bg-muted font-medium text-foreground"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <span className="truncate capitalize">{gamme.name.toLowerCase()}</span>
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
  product: Product
  onClick: () => void
  onEdit: () => void
}) {
  const status = statusConfig[product.status] || statusConfig.Disponible

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
              <h3 className="font-medium truncate">{capitalizeWords(product.name)}</h3>
              {product.promotionActive && (
                <Badge className="bg-green-500 text-white text-xs shrink-0">
                  -{product.promotionPourcentage}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
              {product.category && (
                <span className="text-xs text-muted-foreground">• {product.category}</span>
              )}
            </div>
          </div>

          {/* Center: Price */}
          <div className="flex items-center gap-1 shrink-0">
            <Euro className="h-3.5 w-3.5 text-muted-foreground" />
            {product.promotionActive && product.prixPromo ? (
              <>
                <span className="text-muted-foreground line-through text-sm tabular-nums">{product.price.toFixed(2)}</span>
                <span className="font-semibold text-green-600 tabular-nums">{product.prixPromo.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-semibold tabular-nums">{product.price.toFixed(2)}</span>
            )}
            <span className="text-xs text-muted-foreground">/ mois</span>
          </div>

          {/* Right: Badges and actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {product.type}
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

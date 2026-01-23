"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Package2,
  ShoppingCart,
  MoreVertical,
  Search,
  Settings,
  AlertCircle,
  Euro,
  Box,
  User,
  Calendar,
  Hash,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import type { Product, ProductStatus, ProductType } from "@/types/product"
import {
  createProduitDocument,
  createProduitPublication,
  createProduitVersion,
  getProduitVersions,
  getProduitDocuments,
  getProduitPublicationsByVersion,
  getSocietesByOrganisation,
} from "@/actions/catalogue"
import type {
  ProduitVersion,
  ProduitDocument,
  ProduitPublication,
} from "@proto/products/products"
import { TypeDocumentProduit, VisibilitePublication } from "@/lib/proto-enums"
import type { Societe } from "@proto/organisations/organisations"

interface ProductDetailsPanelProps {
  product: Product | null
  onAddToCart: (product: Product) => void
}

const statusColors: Record<ProductStatus, string> = {
  Disponible: "bg-green-500/10 text-green-700 border-green-200",
  Rupture: "bg-red-500/10 text-red-700 border-red-200",
  "Sur commande": "bg-orange-500/10 text-orange-700 border-orange-200",
  Archivé: "bg-gray-500/10 text-gray-700 border-gray-200",
}

const typeColors: Record<ProductType, string> = {
  Interne: "bg-blue-500/10 text-blue-700 border-blue-200",
  Partenaire: "bg-purple-500/10 text-purple-700 border-purple-200",
}

export function ProductDetailsPanel({
  product,
  onAddToCart,
}: ProductDetailsPanelProps) {
  const [versions, setVersions] = React.useState<ProduitVersion[]>([])
  const [documents, setDocuments] = React.useState<ProduitDocument[]>([])
  const [publications, setPublications] = React.useState<ProduitPublication[]>([])
  const [loadingVersions, setLoadingVersions] = React.useState(false)
  const [loadingDocuments, setLoadingDocuments] = React.useState(false)
  const [loadingPublications, setLoadingPublications] = React.useState(false)
  const [societes, setSocietes] = React.useState<Societe[]>([])
  const [societesLoading, setSocietesLoading] = React.useState(false)

  const [isVersionDialogOpen, setIsVersionDialogOpen] = React.useState(false)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = React.useState(false)
  const [isPublicationDialogOpen, setIsPublicationDialogOpen] = React.useState(false)
  const [savingVersion, setSavingVersion] = React.useState(false)
  const [savingDocument, setSavingDocument] = React.useState(false)
  const [savingPublication, setSavingPublication] = React.useState(false)

  const [versionForm, setVersionForm] = React.useState({
    version: "",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
    breakingChanges: false,
  })
  const [documentForm, setDocumentForm] = React.useState({
    type: String(TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_DIPA),
    title: "",
    fileUrl: "",
    fileHash: "",
    mandatory: false,
  })
  const [publicationForm, setPublicationForm] = React.useState({
    societeId: "",
    channels: "",
    visibilite: String(VisibilitePublication.VISIBILITE_PUBLICATION_INTERNE),
    startAt: "",
    endAt: "",
  })

  const nextVersionNumber = React.useMemo(() => {
    const latest = versions[0]?.version
    return latest ? latest + 1 : 1
  }, [versions])

  const documentTypeLabels: Record<number, string> = {
    [TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_DIPA]: "DIPA",
    [TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_CG]: "CG",
    [TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_CP]: "CP",
    [TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_TARIF]: "Tarif",
    [TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_SCRIPT]: "Script",
    [TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_MEDIA]: "Média",
  }

  const visibiliteLabels: Record<number, string> = {
    [VisibilitePublication.VISIBILITE_PUBLICATION_CACHE]: "Caché",
    [VisibilitePublication.VISIBILITE_PUBLICATION_INTERNE]: "Interne",
    [VisibilitePublication.VISIBILITE_PUBLICATION_PUBLIC]: "Public",
  }

  const selectedVersionId = versions[0]?.id

  const fetchVersions = React.useCallback(async () => {
    if (!product?.id) return
    setLoadingVersions(true)
    const result = await getProduitVersions({ produitId: product.id, page: 1, limit: 10 })
    if (result.data?.versions) {
      setVersions(result.data.versions)
    } else {
      setVersions([])
    }
    setLoadingVersions(false)
  }, [product?.id])

  const fetchSocietes = React.useCallback(async () => {
    if (!product?.organisationId) {
      setSocietes([])
      return
    }
    setSocietesLoading(true)
    const result = await getSocietesByOrganisation(product.organisationId)
    if (result.data?.societes) {
      setSocietes(result.data.societes)
    } else {
      setSocietes([])
    }
    setSocietesLoading(false)
  }, [product?.organisationId])

  const fetchDocuments = React.useCallback(async (versionId: string) => {
    setLoadingDocuments(true)
    const result = await getProduitDocuments({ versionProduitId: versionId })
    if (result.data?.documents) {
      setDocuments(result.data.documents)
    } else {
      setDocuments([])
    }
    setLoadingDocuments(false)
  }, [])

  const fetchPublications = React.useCallback(async (versionId: string) => {
    setLoadingPublications(true)
    const result = await getProduitPublicationsByVersion({ versionProduitId: versionId })
    if (result.data?.publications) {
      setPublications(result.data.publications)
    } else {
      setPublications([])
    }
    setLoadingPublications(false)
  }, [])

  React.useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  React.useEffect(() => {
    fetchSocietes()
  }, [fetchSocietes])

  React.useEffect(() => {
    if (societes.length === 1) {
      setPublicationForm((prev) => ({
        ...prev,
        societeId: prev.societeId || societes[0].id,
      }))
    }
  }, [societes])

  React.useEffect(() => {
    if (!selectedVersionId) {
      setDocuments([])
      setPublications([])
      return
    }
    fetchDocuments(selectedVersionId)
    fetchPublications(selectedVersionId)
  }, [selectedVersionId, fetchDocuments, fetchPublications])

  const formatDate = (value?: string) => {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("fr-FR")
  }

  const getSocieteLabel = (societeId: string) => {
    const societe = societes.find((item) => item.id === societeId)
    return societe?.raisonSociale || societeId
  }

  const computeSha256 = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest("SHA-256", buffer)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  const handleDocumentFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const hash = await computeSha256(file)
      setDocumentForm((prev) => ({
        ...prev,
        fileHash: hash,
        title: prev.title || file.name,
        fileUrl: prev.fileUrl || file.name,
      }))
      toast.success("Hash du document calculé")
    } catch (error) {
      toast.error("Impossible de calculer le hash")
    }
  }

  const openVersionDialog = () => {
    setVersionForm({
      version: String(nextVersionNumber),
      effectiveFrom: "",
      effectiveTo: "",
      notes: "",
      breakingChanges: false,
    })
    setIsVersionDialogOpen(true)
  }

  const openDocumentDialog = () => {
    setDocumentForm({
      type: String(TypeDocumentProduit.TYPE_DOCUMENT_PRODUIT_DIPA),
      title: "",
      fileUrl: "",
      fileHash: "",
      mandatory: false,
    })
    setIsDocumentDialogOpen(true)
  }

  const openPublicationDialog = () => {
    setPublicationForm({
      societeId: "",
      channels: "",
      visibilite: String(VisibilitePublication.VISIBILITE_PUBLICATION_INTERNE),
      startAt: "",
      endAt: "",
    })
    setIsPublicationDialogOpen(true)
  }

  const handleCreateVersion = async () => {
    if (!product?.id) return
    const versionNumber = Number(versionForm.version)
    if (!versionNumber || Number.isNaN(versionNumber)) {
      toast.error("Veuillez renseigner un numero de version valide")
      return
    }
    if (!versionForm.effectiveFrom) {
      toast.error("Veuillez renseigner la date d'effet")
      return
    }

    setSavingVersion(true)
    const result = await createProduitVersion({
      produitId: product.id,
      version: versionNumber,
      effectiveFrom: versionForm.effectiveFrom,
      effectiveTo: versionForm.effectiveTo || undefined,
      notes: versionForm.notes || undefined,
      breakingChanges: versionForm.breakingChanges,
    })
    setSavingVersion(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Version créée")
    setIsVersionDialogOpen(false)
    await fetchVersions()
  }

  const handleCreateDocument = async () => {
    if (!selectedVersionId) {
      toast.error("Aucune version selectionnee")
      return
    }
    if (!documentForm.title || !documentForm.fileUrl || !documentForm.fileHash) {
      toast.error("Veuillez completer tous les champs obligatoires")
      return
    }

    setSavingDocument(true)
    const result = await createProduitDocument({
      versionProduitId: selectedVersionId,
      type: Number(documentForm.type),
      title: documentForm.title,
      fileUrl: documentForm.fileUrl,
      fileHash: documentForm.fileHash,
      mandatory: documentForm.mandatory,
    })
    setSavingDocument(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Document ajoute")
    setIsDocumentDialogOpen(false)
    await fetchDocuments(selectedVersionId)
  }

  const handleCreatePublication = async () => {
    if (!selectedVersionId) {
      toast.error("Aucune version selectionnee")
      return
    }
    if (!publicationForm.societeId || !publicationForm.startAt) {
      toast.error("Veuillez completer les champs obligatoires")
      return
    }

    const channels = publicationForm.channels
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    if (channels.length === 0) {
      toast.error("Veuillez renseigner au moins un canal")
      return
    }

    setSavingPublication(true)
    const result = await createProduitPublication({
      versionProduitId: selectedVersionId,
      societeId: publicationForm.societeId,
      channels,
      visibilite: Number(publicationForm.visibilite),
      startAt: publicationForm.startAt,
      endAt: publicationForm.endAt || undefined,
    })
    setSavingPublication(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Publication creee")
    setIsPublicationDialogOpen(false)
    await fetchPublications(selectedVersionId)
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Empty State Header */}
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Détails du produit
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Package2 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Aucun produit sélectionné
              </p>
              <p className="text-xs text-muted-foreground/60">
                Sélectionnez un produit pour voir ses détails
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground truncate">
          {product.name}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Product Image */}
          <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
            <Package2 className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Product Name and Price */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Réf: {product.sku}
              </p>
            </div>
            <div className="flex items-baseline gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-3xl font-bold text-primary">
                {product.price.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">
                {product.currency}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">
                / mois
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("border", typeColors[product.type as keyof typeof typeColors])}
            >
              {product.type}
            </Badge>
            <Badge
              variant="outline"
              className={cn("border", statusColors[product.status as keyof typeof statusColors])}
            >
              {product.status}
            </Badge>
            {product.supplier && (
              <Badge variant="outline" className="border-gray-200">
                {product.supplier}
              </Badge>
            )}
          </div>

          {/* Low Stock Warning */}
          {product.stock !== undefined && product.stock < 50 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900">
                  Stock faible
                </p>
                <p className="text-xs text-orange-700">
                  Seulement {product.stock} unité(s) disponible(s)
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {(product.stock !== undefined || product.minQuantity) && (
            <div className="grid grid-cols-2 gap-3">
              {product.stock !== undefined && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Stock disponible
                  </p>
                  <p className="text-lg font-bold">{product.stock}</p>
                </div>
              )}
              {product.minQuantity && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Quantité min.
                  </p>
                  <p className="text-lg font-bold">{product.minQuantity}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Versioning & publication</h3>
            <Tabs defaultValue="versions" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="versions">Versions</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="publications">Publications</TabsTrigger>
              </TabsList>

              <TabsContent value="versions" className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Dernière version: {versions[0]?.version ?? "—"}
                  </p>
                  <Button variant="outline" size="sm" onClick={openVersionDialog}>
                    <Plus className="h-4 w-4" />
                    Nouvelle version
                  </Button>
                </div>
                {loadingVersions ? (
                  <div className="text-sm text-muted-foreground">Chargement des versions...</div>
                ) : versions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucune version disponible.</div>
                ) : (
                  versions.map((version) => (
                    <div key={version.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Version {version.version}</div>
                        <Badge variant="secondary">{formatDate(version.effectiveFrom)}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Fin: {formatDate(version.effectiveTo)}
                      </div>
                      {version.notes && (
                        <div className="text-xs text-muted-foreground mt-2">{version.notes}</div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Version sélectionnée: {selectedVersionId ? versions[0]?.version : "—"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openDocumentDialog}
                    disabled={!selectedVersionId}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un document
                  </Button>
                </div>
                {loadingDocuments ? (
                  <div className="text-sm text-muted-foreground">Chargement des documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucun document rattaché.</div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{doc.title}</div>
                        <Badge variant={doc.mandatory ? "destructive" : "secondary"}>
                          {doc.mandatory ? "Obligatoire" : "Optionnel"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Type: {documentTypeLabels[doc.type] || "—"} · Publié: {formatDate(doc.publishedAt)}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="publications" className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Version sélectionnée: {selectedVersionId ? versions[0]?.version : "—"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openPublicationDialog}
                    disabled={!selectedVersionId}
                  >
                    <Plus className="h-4 w-4" />
                    Publier
                  </Button>
                </div>
                {loadingPublications ? (
                  <div className="text-sm text-muted-foreground">Chargement des publications...</div>
                ) : publications.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucune publication.</div>
                ) : (
                  publications.map((pub) => (
                    <div key={pub.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Société: {getSocieteLabel(pub.societeId)}</div>
                        <Badge variant="secondary">{visibiliteLabels[pub.visibilite] || "—"}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Canaux: {pub.channels.join(", ") || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Début: {formatDate(pub.startAt)} · Fin: {formatDate(pub.endAt)}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>

            <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Nouvelle version</DialogTitle>
                  <DialogDescription>
                    Définissez une nouvelle version avec date d'effet.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Version</Label>
                    <Input
                      type="number"
                      value={versionForm.version}
                      onChange={(event) =>
                        setVersionForm((prev) => ({ ...prev, version: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date d'effet</Label>
                      <Input
                        type="date"
                        value={versionForm.effectiveFrom}
                        onChange={(event) =>
                          setVersionForm((prev) => ({
                            ...prev,
                            effectiveFrom: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <Input
                        type="date"
                        value={versionForm.effectiveTo}
                        onChange={(event) =>
                          setVersionForm((prev) => ({
                            ...prev,
                            effectiveTo: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={versionForm.notes}
                      onChange={(event) =>
                        setVersionForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Détails de la version"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Breaking changes</p>
                      <p className="text-xs text-muted-foreground">
                        Activez si cette version nécessite une mise à jour des intégrations.
                      </p>
                    </div>
                    <Switch
                      checked={versionForm.breakingChanges}
                      onCheckedChange={(value) =>
                        setVersionForm((prev) => ({ ...prev, breakingChanges: value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsVersionDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateVersion} disabled={savingVersion}>
                    {savingVersion ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un document</DialogTitle>
                  <DialogDescription>
                    Associez un document à la version active.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fichier</Label>
                    <Input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleDocumentFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Le hash est calculé automatiquement.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={documentForm.type}
                      onValueChange={(value) =>
                        setDocumentForm((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={documentForm.title}
                      onChange={(event) =>
                        setDocumentForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL du fichier</Label>
                    <Input
                      value={documentForm.fileUrl}
                      onChange={(event) =>
                        setDocumentForm((prev) => ({ ...prev, fileUrl: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hash SHA256</Label>
                    <Input
                      value={documentForm.fileHash}
                      onChange={(event) =>
                        setDocumentForm((prev) => ({ ...prev, fileHash: event.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Document obligatoire</p>
                      <p className="text-xs text-muted-foreground">Exigé avant publication.</p>
                    </div>
                    <Switch
                      checked={documentForm.mandatory}
                      onCheckedChange={(value) =>
                        setDocumentForm((prev) => ({ ...prev, mandatory: value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateDocument} disabled={savingDocument}>
                    {savingDocument ? "Création..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isPublicationDialogOpen} onOpenChange={setIsPublicationDialogOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Publier le produit</DialogTitle>
                  <DialogDescription>
                    Définissez les canaux et la visibilité pour une société.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Société</Label>
                    <Select
                      value={publicationForm.societeId}
                      onValueChange={(value) =>
                        setPublicationForm((prev) => ({ ...prev, societeId: value }))
                      }
                    >
                      <SelectTrigger disabled={societesLoading || societes.length === 0}>
                        <SelectValue placeholder="Sélectionnez une société" />
                      </SelectTrigger>
                      <SelectContent>
                        {societes.length === 0 && (
                          <SelectItem value="none" disabled>
                            Aucune société disponible
                          </SelectItem>
                        )}
                        {societes.map((societe) => (
                          <SelectItem key={societe.id} value={societe.id}>
                            {societe.raisonSociale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Canaux (séparés par des virgules)</Label>
                    <Input
                      value={publicationForm.channels}
                      onChange={(event) =>
                        setPublicationForm((prev) => ({ ...prev, channels: event.target.value }))
                      }
                      placeholder="terrain, televente, web"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Visibilité</Label>
                    <Select
                      value={publicationForm.visibilite}
                      onValueChange={(value) =>
                        setPublicationForm((prev) => ({ ...prev, visibilite: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une visibilité" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(visibiliteLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Input
                        type="date"
                        value={publicationForm.startAt}
                        onChange={(event) =>
                          setPublicationForm((prev) => ({ ...prev, startAt: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Input
                        type="date"
                        value={publicationForm.endAt}
                        onChange={(event) =>
                          setPublicationForm((prev) => ({ ...prev, endAt: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPublicationDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreatePublication} disabled={savingPublication}>
                    {savingPublication ? "Publication..." : "Publier"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Informations</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">SKU</p>
                  <p className="text-sm font-medium truncate">{product.sku}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Box className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Catégorie</p>
                  <p className="text-sm font-medium">{product.category}</p>
                </div>
              </div>

              {product.stock !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="text-sm font-medium">
                      {product.stock} unité(s)
                    </p>
                  </div>
                </div>
              )}

              {product.minQuantity && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Box className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Quantité minimum
                    </p>
                    <p className="text-sm font-medium">{product.minQuantity}</p>
                  </div>
                </div>
              )}

              {product.supplier && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Fournisseur</p>
                    <p className="text-sm font-medium">{product.supplier}</p>
                  </div>
                </div>
              )}

              {product.createdAt && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="text-sm font-medium">
                      {new Date(product.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => onAddToCart(product)}
          disabled={product.status === "Rupture"}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.status === "Sur commande" ? "Commander" : "Ajouter au panier"}
        </Button>
        <Button variant="outline" className="w-full" size="lg">
          Voir les détails complets
        </Button>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { DataTable } from "@/components/data-table-basic"
import { CreateShipmentDialog } from "@/components/shipments/create-shipment-dialog"
import { ShipmentTrackingSheet } from "@/components/shipments/shipment-tracking-sheet"
import { getExpeditionsByOrganisation } from "@/actions/expeditions"
import type { ExpeditionResponse } from "@proto-frontend/logistics/logistics"
import { useOrganisation } from "@/contexts/organisation-context"

// Type local pour la compatibilité avec l'ancien code
type ExpeditionEtat = "en_attente" | "pris_en_charge" | "en_transit" | "en_livraison" | "livre" | "echec_livraison" | "retourne"
import { createColumns } from "./columns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ShipmentStatus, ShipmentOrder } from "@/types/shipment"
import {
  Search,
  Package,
  RefreshCw,
  Plus,
  Download,
  Truck,
  PackageCheck,
  AlertTriangle,
  PackageSearch,
  PackageX,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react"

type ShipmentStatusOption = {
  value: ShipmentStatus | "all"
  label: string
}

const statusOptions: ShipmentStatusOption[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "in_preparation", label: "Préparation" },
  { value: "shipped", label: "Expédié" },
  { value: "in_transit", label: "En transit" },
  { value: "out_for_delivery", label: "En livraison" },
  { value: "delivered", label: "Livré" },
  { value: "delayed", label: "Retard" },
  { value: "cancelled", label: "Annulé" },
]

// Mapping des états API vers les statuts UI
const ETAT_TO_STATUS: Record<ExpeditionEtat, ShipmentStatus> = {
  en_attente: "pending",
  pris_en_charge: "in_preparation",
  en_transit: "in_transit",
  en_livraison: "out_for_delivery",
  livre: "delivered",
  echec_livraison: "delayed",
  retourne: "cancelled",
}

// Fonction pour mapper une expédition gRPC vers ShipmentOrder
function mapExpeditionToShipmentOrder(expedition: ExpeditionResponse): ShipmentOrder {
  const etat = expedition.etat as ExpeditionEtat
  return {
    id: expedition.id,
    orderNumber: expedition.referenceCommande,
    trackingNumber: expedition.trackingNumber,
    company: "N/A", // TODO: Enrichir avec les données client
    clientName: "Client", // TODO: Enrichir avec les données client
    product: expedition.nomProduit || "Produit",
    carrier: "Non défini", // TODO: Enrichir avec les données transporteur
    status: ETAT_TO_STATUS[etat] || "pending",
    destination: `${expedition.adresseDestination || ""}, ${expedition.codePostalDestination || ""} ${expedition.villeDestination || ""}`.trim(),
    weightKg: expedition.poids || 0,
    createdAt: expedition.dateCreation,
    shippedAt: expedition.dateExpedition || undefined,
    estimatedDelivery: expedition.dateLivraisonEstimee || undefined,
    deliveredAt: expedition.dateLivraison || undefined,
    lastCheckpoint: expedition.lieuActuel || "Non disponible",
    contractRef: undefined, // TODO: Enrichir avec les données contrat
  }
}

const inTransitStatuses: ShipmentStatus[] = ["shipped", "in_transit", "out_for_delivery"]

interface ExpeditionsPageClientProps {
  initialExpeditions?: ExpeditionResponse[] | null
}

export function ExpeditionsPageClient({ initialExpeditions }: ExpeditionsPageClientProps) {
  const { activeOrganisation } = useOrganisation()
  const organisationId = activeOrganisation?.organisationId || null

  // Ref to track initial fetch
  const hasFetched = React.useRef(!!initialExpeditions)

  // État pour les données expéditions - initialize with SSR data if available
  const [expeditions, setExpeditions] = React.useState<ExpeditionResponse[]>(initialExpeditions || [])
  const [loading, setLoading] = React.useState(!initialExpeditions)
  const [error, setError] = React.useState<Error | null>(null)

  // Fonction de chargement des expéditions
  const fetchExpeditions = React.useCallback(async () => {
    if (!organisationId) return

    setLoading(true)
    setError(null)

    const result = await getExpeditionsByOrganisation({
      organisationId,
    })

    if (result.error) {
      setError(new Error(result.error))
    } else if (result.data) {
      setExpeditions(result.data.expeditions)
    }

    setLoading(false)
  }, [organisationId])

  // Charger les expéditions au montage - skip if SSR data provided
  React.useEffect(() => {
    if (!organisationId || hasFetched.current) return
    hasFetched.current = true
    fetchExpeditions()
  }, [organisationId, fetchExpeditions])

  const refetch = fetchExpeditions

  // États des filtres (sans filtre société - géré par le header global)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [productFilter, setProductFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<ShipmentStatus | "all">("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  // États des modales
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [trackingSheetOpen, setTrackingSheetOpen] = React.useState(false)
  const [selectedShipment, setSelectedShipment] = React.useState<ShipmentOrder | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Compter les filtres avancés actifs
  const activeAdvancedFiltersCount = React.useMemo(() => {
    let count = 0
    if (productFilter && productFilter !== "all") count++
    if (statusFilter && statusFilter !== "all") count++
    return count
  }, [productFilter, statusFilter])

  // Mapper les expéditions vers le format attendu
  const shipmentOrders = React.useMemo(
    () => expeditions.map(mapExpeditionToShipmentOrder),
    [expeditions]
  )

  const totalShipments = shipmentOrders.length

  const products = React.useMemo(
    () =>
      Array.from(new Set(shipmentOrders.map((shipment) => shipment.product))).sort((a, b) =>
        a.localeCompare(b, "fr-FR")
      ),
    [shipmentOrders]
  )

  const filteredShipments = React.useMemo(() => {
    return shipmentOrders.filter((shipment) => {
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        [shipment.orderNumber, shipment.trackingNumber, shipment.clientName, shipment.company]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesProduct = productFilter === "all" || shipment.product === productFilter
      const matchesStatus = statusFilter === "all" || shipment.status === statusFilter

      return matchesSearch && matchesProduct && matchesStatus
    })
  }, [shipmentOrders, productFilter, searchTerm, statusFilter])

  // Calculer les totaux
  const totals = React.useMemo(() => {
    const inTransit = filteredShipments.filter((shipment) =>
      inTransitStatuses.includes(shipment.status)
    ).length
    const delivered = filteredShipments.filter((shipment) => shipment.status === "delivered").length
    const delayed = filteredShipments.filter((shipment) => shipment.status === "delayed").length

    return {
      total: filteredShipments.length,
      delivered,
      inTransit,
      delayed,
    }
  }, [filteredShipments])

  // Handlers
  const handleTrackShipment = React.useCallback((shipment: ShipmentOrder) => {
    setSelectedShipment(shipment)
    setTrackingSheetOpen(true)
  }, [])

  const handleMarkDelivered = React.useCallback((shipment: ShipmentOrder) => {
    toast.success("Expédition marquée comme livrée", {
      description: `Commande ${shipment.orderNumber}`,
    })
    refetch()
  }, [refetch])

  const handleRetryShipment = React.useCallback((shipment: ShipmentOrder) => {
    toast.info("Relance de l'expédition en cours...", {
      description: `Commande ${shipment.orderNumber}`,
    })
  }, [])

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.success("Données actualisées")
  }, [refetch])

  const handleExport = React.useCallback(() => {
    if (filteredShipments.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Commande", "Suivi", "Client", "Produit", "Statut", "Destination"]
    const rows = filteredShipments.map((s) => [
      s.orderNumber,
      s.trackingNumber,
      s.clientName,
      s.product,
      s.status,
      s.destination,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(";")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `expeditions_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Export réussi", {
      description: `${filteredShipments.length} expéditions exportées`,
    })
  }, [filteredShipments])

  const handleShipmentCreated = React.useCallback((data: { trackingNumber: string; labelUrl: string }) => {
    refetch()
    toast.success("Expédition créée", {
      description: `Numéro de suivi : ${data.trackingNumber}`,
      action: {
        label: "Télécharger",
        onClick: () => window.open(data.labelUrl, "_blank"),
      },
    })
  }, [refetch])

  const resetFilters = React.useCallback(() => {
    setSearchTerm("")
    setProductFilter("all")
    setStatusFilter("all")
  }, [])

  // Clic sur une KPI card pour filtrer
  const handleKpiClick = (type: "total" | "inTransit" | "delivered" | "delayed") => {
    switch (type) {
      case "total":
        setStatusFilter("all")
        break
      case "inTransit":
        // Filtrer sur "in_transit" comme statut représentatif
        setStatusFilter("in_transit")
        break
      case "delivered":
        setStatusFilter("delivered")
        break
      case "delayed":
        setStatusFilter("delayed")
        break
    }
  }

  // Colonnes avec actions intégrées
  const columns = React.useMemo(
    () =>
      createColumns({
        onTrackShipment: handleTrackShipment,
        onMarkDelivered: handleMarkDelivered,
        onRetryShipment: handleRetryShipment,
      }),
    [handleTrackShipment, handleMarkDelivered, handleRetryShipment]
  )

  // Error state
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Erreur lors du chargement des expéditions</p>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </main>
    )
  }

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 min-h-0">
        {/* Barre de recherche principale + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par n° commande, suivi, client..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "gap-2",
              showAdvancedFilters && "bg-accent"
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filtres
            {activeAdvancedFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 size-5 p-0 flex items-center justify-center text-xs">
                {activeAdvancedFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn("size-4 transition-transform", showAdvancedFilters && "rotate-180")} />
          </Button>

          {activeAdvancedFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
              <X className="size-4" />
              Réinitialiser
            </Button>
          )}

          <div className="flex-1" />

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Nouvelle expédition
          </Button>
        </div>

        {/* Filtres avancés (collapsible) */}
        <Collapsible open={showAdvancedFilters}>
          <CollapsibleContent>
            <Card className="bg-blue-100 border border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger className="bg-white w-full pl-10">
                        <SelectValue placeholder="Produit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les produits</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product} value={product}>
                            {product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ShipmentStatus | "all")}>
                      <SelectTrigger className="bg-white w-full pl-10">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* KPI Cards cliquables */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
          {/* Total */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
              statusFilter === "all" && "ring-2 ring-primary/50"
            )}
            onClick={() => handleKpiClick("total")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total filtré</p>
                  <p className="text-2xl font-semibold">{totals.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sur {totalShipments} expédition{totalShipments > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <PackageSearch className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* En cours */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-sky-500/50",
              statusFilter === "in_transit" && "ring-2 ring-sky-500/50"
            )}
            onClick={() => handleKpiClick("inTransit")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-2xl font-semibold text-sky-700">{totals.inTransit}</p>
                  <p className="text-xs text-muted-foreground mt-1">Expédié, transit ou livraison</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                  <Truck className="size-5 text-sky-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Livrées */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-emerald-500/50",
              statusFilter === "delivered" && "ring-2 ring-emerald-500/50"
            )}
            onClick={() => handleKpiClick("delivered")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Livrées</p>
                  <p className="text-2xl font-semibold text-emerald-700">{totals.delivered}</p>
                  <p className="text-xs text-muted-foreground mt-1">Expéditions terminées</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <PackageCheck className="size-5 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retards */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-red-500/50",
              statusFilter === "delayed" && "ring-2 ring-red-500/50"
            )}
            onClick={() => handleKpiClick("delayed")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Retards</p>
                  <p className="text-2xl font-semibold text-red-600">{totals.delayed}</p>
                  <p className="text-xs text-muted-foreground mt-1">À surveiller</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="size-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau */}
        <Card className="flex-1 min-h-0 bg-blue-100 border-blue-200 flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredShipments.length} expédition{filteredShipments.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Tableau ou état vide */}
            <div className="flex-1 min-h-0">
              {filteredShipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <PackageX className="size-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Aucune expédition</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {shipmentOrders.length === 0
                        ? "Créez votre première expédition pour commencer"
                        : "Aucune expédition ne correspond à vos critères de recherche"}
                    </p>
                  </div>
                  {shipmentOrders.length === 0 && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer ma première expédition
                    </Button>
                  )}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredShipments}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog de création d'expédition */}
      <CreateShipmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleShipmentCreated}
      />

      {/* Sheet de suivi */}
      <ShipmentTrackingSheet
        shipment={selectedShipment}
        open={trackingSheetOpen}
        onOpenChange={setTrackingSheetOpen}
      />
    </>
  )
}

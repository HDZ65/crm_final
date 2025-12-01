"use client"

import * as React from "react"
import {
  ShipmentsFilters,
  type ShipmentStatusOption,
} from "@/components/shipments/shipments-filters"
import {
  ShipmentsSummaryCards,
  type ShipmentTotals,
} from "@/components/shipments/shipments-summary-cards"
import { ShipmentsTableCard } from "@/components/shipments/shipments-table-card"
import { CreateShipmentDialog } from "@/components/shipments/create-shipment-dialog"
import { ShipmentTrackingSheet } from "@/components/shipments/shipment-tracking-sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useExpeditions, type ExpeditionDto, type ExpeditionEtat } from "@/hooks/logistics"
import { useOrganisation } from "@/contexts/organisation-context"
import { createColumns } from "./columns"
import { toast } from "sonner"
import type { ShipmentStatus, ShipmentOrder } from "@/types/shipment"

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

// Fonction pour mapper une expédition API vers ShipmentOrder
function mapExpeditionToShipmentOrder(expedition: ExpeditionDto): ShipmentOrder {
  return {
    id: expedition.id,
    orderNumber: expedition.referenceCommande,
    trackingNumber: expedition.trackingNumber,
    company: expedition.client?.entreprise || `${expedition.client?.nom || ""} ${expedition.client?.prenom || ""}`.trim(),
    clientName: expedition.client ? `${expedition.client.nom} ${expedition.client.prenom}`.trim() : "Client inconnu",
    product: expedition.nomProduit,
    carrier: expedition.transporteur?.type || "Non défini",
    status: ETAT_TO_STATUS[expedition.etat] || "pending",
    destination: `${expedition.adresseDestination}, ${expedition.codePostalDestination} ${expedition.villeDestination}`,
    weightKg: expedition.poids || 0,
    createdAt: expedition.dateCreation,
    shippedAt: expedition.dateExpedition || undefined,
    estimatedDelivery: expedition.dateLivraisonEstimee || undefined,
    deliveredAt: expedition.dateLivraison || undefined,
    lastCheckpoint: expedition.lieuActuel || "Non disponible",
    contractRef: expedition.contrat?.referenceExterne,
  }
}

const inTransitStatuses: ShipmentStatus[] = ["shipped", "in_transit", "out_for_delivery"]

export default function ShipmentsPage() {
  const { currentOrganisation } = useOrganisation()
  const organisationId = currentOrganisation?.id || null

  const { expeditions, loading, error, refetch } = useExpeditions(organisationId)

  // États des filtres
  const [searchTerm, setSearchTerm] = React.useState("")
  const [companyFilter, setCompanyFilter] = React.useState<string>("all")
  const [productFilter, setProductFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<ShipmentStatus | "all">("all")

  // États des modales
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [trackingSheetOpen, setTrackingSheetOpen] = React.useState(false)
  const [selectedShipment, setSelectedShipment] = React.useState<ShipmentOrder | null>(null)

  // Mapper les expéditions vers le format attendu
  const shipmentOrders = React.useMemo(
    () => expeditions.map(mapExpeditionToShipmentOrder),
    [expeditions]
  )

  const totalShipments = shipmentOrders.length

  const companies = React.useMemo(
    () =>
      Array.from(new Set(shipmentOrders.map((shipment) => shipment.company))).sort((a, b) =>
        a.localeCompare(b, "fr-FR")
      ),
    [shipmentOrders]
  )

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

      const matchesCompany = companyFilter === "all" || shipment.company === companyFilter
      const matchesProduct = productFilter === "all" || shipment.product === productFilter
      const matchesStatus = statusFilter === "all" || shipment.status === statusFilter

      return matchesSearch && matchesCompany && matchesProduct && matchesStatus
    })
  }, [shipmentOrders, companyFilter, productFilter, searchTerm, statusFilter])

  // Handlers pour les actions
  const handleCreateShipment = React.useCallback(() => {
    setCreateDialogOpen(true)
  }, [])

  const handleShipmentCreated = React.useCallback((data: { trackingNumber: string; labelUrl: string }) => {
    // Rafraîchir la liste après création
    refetch()
    toast.success("Expédition créée", {
      description: `Numéro de suivi : ${data.trackingNumber}`,
      action: {
        label: "Télécharger",
        onClick: () => window.open(data.labelUrl, "_blank"),
      },
    })
  }, [refetch])

  const handleTrackShipment = React.useCallback((shipment: ShipmentOrder) => {
    setSelectedShipment(shipment)
    setTrackingSheetOpen(true)
  }, [])

  const handleMarkDelivered = React.useCallback((shipment: ShipmentOrder) => {
    // TODO: Appeler l'API pour marquer comme livré
    toast.success("Expédition marquée comme livrée", {
      description: `Commande ${shipment.orderNumber}`,
    })
    refetch()
  }, [refetch])

  const handleRetryShipment = React.useCallback((shipment: ShipmentOrder) => {
    // TODO: Appeler l'API pour relancer l'envoi
    toast.info("Relance de l'expédition en cours...", {
      description: `Commande ${shipment.orderNumber}`,
    })
  }, [])

  const handleRefresh = React.useCallback(() => {
    refetch()
    toast.success("Données actualisées")
  }, [refetch])

  const handleExport = React.useCallback(() => {
    // Export CSV des expéditions filtrées
    const headers = ["Commande", "Suivi", "Client", "Produit", "Statut", "Destination"]
    const rows = filteredShipments.map((s) => [
      s.orderNumber,
      s.trackingNumber,
      s.clientName,
      s.product,
      s.status,
      s.destination,
    ])

    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
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

  const totals = React.useMemo<ShipmentTotals>(() => {
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

  const handleResetFilters = () => {
    setSearchTerm("")
    setCompanyFilter("all")
    setProductFilter("all")
    setStatusFilter("all")
  }

  // Loading state
  if (loading && expeditions.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-4 min-h-0">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr] min-h-0 flex-1">
          <Skeleton className="h-full min-h-[400px]" />
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="flex-1 min-h-[300px]" />
          </div>
        </div>
      </main>
    )
  }

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
        <div className="grid gap-4 xl:grid-cols-[320px_1fr] min-h-0 flex-1">
          <ShipmentsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            companyFilter={companyFilter}
            onCompanyChange={(value) => setCompanyFilter(value)}
            productFilter={productFilter}
            onProductChange={(value) => setProductFilter(value)}
            statusFilter={statusFilter}
            onStatusChange={(value) => setStatusFilter(value)}
            companies={companies}
            products={products}
            filteredCount={filteredShipments.length}
            onReset={handleResetFilters}
            statusOptions={statusOptions}
          />

          <div className="flex flex-col gap-4 min-h-0">
            <ShipmentsSummaryCards totals={totals} totalShipments={totalShipments} />
            <ShipmentsTableCard
              columns={columns}
              data={filteredShipments}
              total={totals.total}
              onCreateShipment={handleCreateShipment}
              onRefresh={handleRefresh}
              onExport={handleExport}
            />
          </div>
        </div>
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

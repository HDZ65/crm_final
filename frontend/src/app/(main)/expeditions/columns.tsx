"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ShipmentOrder, ShipmentStatus } from "@/types/shipment"
import {
  Copy,
  Download,
  ExternalLink,
  MapPin,
  MoreVertical,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

const statusMeta: Record<
  ShipmentStatus,
  {
    label: string
    className: string
  }
> = {
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  in_preparation: {
    label: "Préparation",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  shipped: {
    label: "Expédié",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  in_transit: {
    label: "En transit",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  out_for_delivery: {
    label: "En livraison",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  delivered: {
    label: "Livré",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  delayed: {
    label: "Retard",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
}

// Fonction pour créer les colonnes avec callbacks
export function createColumns(options: {
  onTrackShipment?: (shipment: ShipmentOrder) => void
  onMarkDelivered?: (shipment: ShipmentOrder) => void
  onRetryShipment?: (shipment: ShipmentOrder) => void
}): ColumnDef<ShipmentOrder>[] {
  const { onTrackShipment, onMarkDelivered, onRetryShipment } = options

  return [
    {
      accessorKey: "orderNumber",
      header: "Commande / Suivi",
      cell: ({ row }) => {
        const shipment = row.original

        const copyTracking = (e: React.MouseEvent) => {
          e.stopPropagation()
          navigator.clipboard.writeText(shipment.trackingNumber)
          toast.success("Numéro de suivi copié !")
        }

        return (
          <div className="space-y-1">
            <div className="text-sm font-semibold tracking-tight">{shipment.orderNumber}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyTracking}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <span>Suivi : {shipment.trackingNumber}</span>
                    <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cliquez pour copier</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {shipment.contractRef && (
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                Contrat {shipment.contractRef}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => {
        const shipment = row.original

        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{shipment.clientName}</p>
            <p className="text-xs text-muted-foreground uppercase">{shipment.company}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3" />
              {shipment.destination}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "product",
      header: "Produit / Transporteur",
      cell: ({ row }) => {
        const shipment = row.original

        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{shipment.product}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Truck className="size-3" />
              {shipment.carrier}
            </p>
            <p className="text-xs text-muted-foreground">
              {shipment.weightKg.toLocaleString("fr-FR")} kg
            </p>
          </div>
        )
      },
    },
    {
      id: "dates",
      header: "Dates clés",
      cell: ({ row }) => {
        const { createdAt, shippedAt, estimatedDelivery, deliveredAt } = row.original

        const formatDate = (date: string | undefined) => {
          if (!date) return null
          return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })
        }

        return (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Créée : {formatDate(createdAt) || createdAt}</p>
            {shippedAt && <p>Expédiée : {formatDate(shippedAt) || shippedAt}</p>}
            {estimatedDelivery && (
              <p className="font-medium text-foreground">
                Livraison : {formatDate(estimatedDelivery) || estimatedDelivery}
              </p>
            )}
            {deliveredAt && (
              <p className="text-green-600">
                Livrée : {formatDate(deliveredAt) || deliveredAt}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const shipment = row.original
        const meta = statusMeta[shipment.status]

        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className={cn("w-fit", meta.className)}>
              {meta.label}
            </Badge>
            {shipment.lastCheckpoint && shipment.lastCheckpoint !== "Non disponible" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" />
                {shipment.lastCheckpoint}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const shipment = row.original
        const canMarkDelivered = !["delivered", "cancelled"].includes(shipment.status)
        const canRetry = ["delayed", "cancelled"].includes(shipment.status)

        return (
          <div className="flex items-center gap-1">
            {/* Bouton de suivi rapide */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary"
                    onClick={() => onTrackShipment?.(shipment)}
                  >
                    <ExternalLink className="size-4" />
                    <span className="sr-only">Suivre</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Suivre l&#39;expédition</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Menu d'actions supplémentaires */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => onTrackShipment?.(shipment)}
                >
                  <ExternalLink className="size-4" />
                  Voir le suivi détaillé
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => {
                    navigator.clipboard.writeText(shipment.trackingNumber)
                    toast.success("Numéro de suivi copié !")
                  }}
                >
                  <Copy className="size-4" />
                  Copier le n° de suivi
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => {
                    console.log("Exporter les détails pour", shipment.orderNumber)
                    toast.info("Export en cours...")
                  }}
                >
                  <Download className="size-4" />
                  Exporter la fiche
                </DropdownMenuItem>

                {(canMarkDelivered || canRetry) && <DropdownMenuSeparator />}

                {canMarkDelivered && (
                  <DropdownMenuItem
                    className="gap-2 text-emerald-600 focus:text-emerald-700"
                    onSelect={() => onMarkDelivered?.(shipment)}
                  >
                    <PackageCheck className="size-4" />
                    Marquer livré
                  </DropdownMenuItem>
                )}

                {canRetry && (
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={() => onRetryShipment?.(shipment)}
                  >
                    <RefreshCw className="size-4" />
                    Relancer l&#39;envoi
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}

// Export par défaut pour la rétrocompatibilité
export const columns: ColumnDef<ShipmentOrder>[] = createColumns({})

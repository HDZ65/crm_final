"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  RefreshCw,
  Copy,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { useMailevaTracking } from "@/hooks/email"
import type { ShipmentOrder, ShipmentStatus } from "@/types/shipment"

// ============================================================================
// Types & Helpers
// ============================================================================

const STATUS_CONFIG: Record<ShipmentStatus, {
  label: string
  color: string
  bgColor: string
  icon: React.ElementType
}> = {
  pending: {
    label: "En attente",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    icon: Clock,
  },
  in_preparation: {
    label: "En préparation",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    icon: Package,
  },
  shipped: {
    label: "Expédié",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900",
    icon: Package,
  },
  in_transit: {
    label: "En transit",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900",
    icon: Truck,
  },
  out_for_delivery: {
    label: "En livraison",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    icon: Truck,
  },
  delivered: {
    label: "Livré",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900",
    icon: CheckCircle,
  },
  delayed: {
    label: "Retardé",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Annulé",
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    icon: AlertCircle,
  },
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ============================================================================
// Composants internes
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

function TrackingTimeline({
  events,
}: {
  events: Array<{ code: string; label: string; date: string; location?: string | null }>
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Truck className="size-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aucun événement de suivi disponible</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-muted" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const isFirst = index === 0
          const isDelivered = event.code.toLowerCase().includes("delivered") || event.code.toLowerCase().includes("livre")

          return (
            <div key={index} className="relative flex gap-4 pl-6">
              {/* Point sur la timeline */}
              <div
                className={cn(
                  "absolute left-0 size-3 rounded-full border-2 border-background",
                  isFirst
                    ? isDelivered
                      ? "bg-green-500"
                      : "bg-primary"
                    : "bg-muted-foreground/50"
                )}
              />

              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm",
                  isFirst && "text-primary"
                )}>
                  {event.label}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="size-3" />
                  {formatDate(event.date)}
                  {event.location && (
                    <>
                      <span>•</span>
                      <MapPin className="size-3" />
                      {event.location}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Composant principal
// ============================================================================

interface ShipmentTrackingSheetProps {
  shipment: ShipmentOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShipmentTrackingSheet({
  shipment,
  open,
  onOpenChange,
}: ShipmentTrackingSheetProps) {
  const { trackShipment: trackShipmentFn, data, error } = useMailevaTracking()
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleRefresh = React.useCallback(async () => {
    if (!shipment?.trackingNumber) return
    setLoading(true)
    try {
      await trackShipmentFn(shipment.trackingNumber)
      setLastRefresh(new Date())
    } catch {
      toast.error("Erreur lors du suivi", {
        description: "Impossible de récupérer les informations de suivi",
      })
    } finally {
      setLoading(false)
    }
  }, [shipment?.trackingNumber, trackShipmentFn])

  // Charger le suivi à l'ouverture
  React.useEffect(() => {
    if (open && shipment?.trackingNumber) {
      handleRefresh()
    }
  }, [open, shipment?.trackingNumber, handleRefresh])

  const copyTrackingNumber = () => {
    if (shipment?.trackingNumber) {
      navigator.clipboard.writeText(shipment.trackingNumber)
      toast.success("Numéro de suivi copié !")
    }
  }

  if (!shipment) return null

  const statusConfig = STATUS_CONFIG[shipment.status]
  const StatusIcon = statusConfig.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Suivi de l&#39;expédition
          </SheetTitle>
          <SheetDescription>
            Commande {shipment.orderNumber}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Statut principal */}
          <div className={cn(
            "flex items-center gap-4 rounded-lg p-4",
            statusConfig.bgColor
          )}>
            <div className={cn(
              "flex size-12 items-center justify-center rounded-full bg-background",
              statusConfig.color
            )}>
              <StatusIcon className="size-6" />
            </div>
            <div className="flex-1">
              <div className={cn("text-lg font-semibold", statusConfig.color)}>
                {statusConfig.label}
              </div>
              {shipment.lastCheckpoint && shipment.lastCheckpoint !== "Non disponible" && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  {shipment.lastCheckpoint}
                </div>
              )}
            </div>
          </div>

          {/* Numéro de suivi */}
          <div className="rounded-lg border p-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Numéro de suivi
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                {shipment.trackingNumber}
              </code>
              <Button size="icon" variant="ghost" onClick={copyTrackingNumber}>
                <Copy className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" asChild>
                <a
                  href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${shipment.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Détails de l&#39;expédition</h4>

            <div className="grid gap-4">
              <InfoRow
                icon={Package}
                label="Produit"
                value={shipment.product}
              />
              <InfoRow
                icon={Truck}
                label="Transporteur"
                value={
                  <Badge variant="secondary">{shipment.carrier}</Badge>
                }
              />
              <InfoRow
                icon={MapPin}
                label="Destination"
                value={shipment.destination}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={Calendar}
                label="Créée le"
                value={formatDate(shipment.createdAt)}
              />
              <InfoRow
                icon={Calendar}
                label="Expédiée le"
                value={formatDate(shipment.shippedAt)}
              />
              <InfoRow
                icon={Calendar}
                label="Livraison estimée"
                value={formatDate(shipment.estimatedDelivery)}
              />
              {shipment.deliveredAt && (
                <InfoRow
                  icon={CheckCircle}
                  label="Livrée le"
                  value={formatDate(shipment.deliveredAt)}
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Timeline de suivi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Historique du suivi</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="size-4 mr-2" />
                {loading ? "Actualisation..." : "Actualiser"}
              </Button>
            </div>

            {lastRefresh && (
              <p className="text-xs text-muted-foreground">
                Dernière mise à jour : {formatDate(lastRefresh.toISOString())}
              </p>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 inline mr-2" />
                {error.message}
              </div>
            )}

            <TrackingTimeline
              events={data?.events || []}
            />
          </div>

          {/* Informations client */}
          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Client</h4>
            <div className="rounded-lg border p-4">
              <div className="font-medium">{shipment.clientName}</div>
              {shipment.company && shipment.company !== shipment.clientName && (
                <div className="text-sm text-muted-foreground">{shipment.company}</div>
              )}
              {shipment.contractRef && (
                <Badge variant="outline" className="mt-2">
                  Contrat: {shipment.contractRef}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

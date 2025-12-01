import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, Plus, Eye, Truck, CheckCircle2, XCircle, Clock, MapPin } from "lucide-react"
import type { Shipment, ShipmentStatus } from "@/types/client"

interface ClientShipmentsProps {
  shipments: Shipment[]
  onCreateShipment?: () => void
}

const statusConfig: Record<
  ShipmentStatus,
  { label: string; variant: string; icon: React.ElementType }
> = {
  pending: {
    label: "En attente",
    variant: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  },
  in_transit: {
    label: "En transit",
    variant: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Truck,
  },
  out_for_delivery: {
    label: "En livraison",
    variant: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Package,
  },
  delivered: {
    label: "Livré",
    variant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Échec",
    variant: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  returned: {
    label: "Retourné",
    variant: "bg-amber-100 text-amber-700 border-amber-200",
    icon: XCircle,
  },
}

export function ClientShipments({ shipments, onCreateShipment }: ClientShipmentsProps) {
  const [selectedShipment, setSelectedShipment] = React.useState<Shipment | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setDetailsOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main shipments list */}
        <div className="lg:col-span-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
                    <Package className="size-5" />
                    Expéditions & Colis
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Suivi des expéditions et livraisons
                  </p>
                </div>
                <Button onClick={onCreateShipment} size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Nouvelle expédition
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-sidebar text-sidebar-foreground hover:bg-sidebar">
                      <TableHead>N° de suivi</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date création</TableHead>
                      <TableHead>Livraison prévue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Aucune expédition enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      shipments.map((shipment) => {
                        const config = statusConfig[shipment.status]
                        const StatusIcon = config.icon
                        return (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-mono font-medium">
                              {shipment.trackingNumber}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <div className="font-medium">{shipment.recipientName}</div>
                                <div className="text-xs text-slate-500 truncate">
                                  {shipment.recipientAddress}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{shipment.product}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={config.variant}>
                                <StatusIcon className="size-3 mr-1" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{shipment.createdAt}</TableCell>
                            <TableCell>
                              {shipment.estimatedDelivery || (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(shipment)}
                              >
                                <Eye className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats sidebar */}
        <div className="lg:col-span-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-950">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <StatsItem
                  label="En transit"
                  count={shipments.filter((s) => s.status === "in_transit").length}
                  color="blue"
                />
                <StatsItem
                  label="En livraison"
                  count={shipments.filter((s) => s.status === "out_for_delivery").length}
                  color="purple"
                />
                <StatsItem
                  label="Livrés"
                  count={shipments.filter((s) => s.status === "delivered").length}
                  color="emerald"
                />
                <StatsItem
                  label="En attente"
                  count={shipments.filter((s) => s.status === "pending").length}
                  color="slate"
                />
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-2xl font-bold text-slate-900">{shipments.length}</div>
                  <div className="text-sm text-slate-600">Total expéditions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shipment details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;expédition</DialogTitle>
            <DialogDescription>
              Suivi détaillé du colis {selectedShipment?.trackingNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-xs text-slate-600 mb-1">N° de suivi</div>
                  <div className="font-mono font-semibold">
                    {selectedShipment.trackingNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Statut</div>
                  <Badge
                    variant="secondary"
                    className={statusConfig[selectedShipment.status].variant}
                  >
                    {statusConfig[selectedShipment.status].label}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Produit</div>
                  <div className="font-medium">{selectedShipment.product}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Poids</div>
                  <div className="font-medium">
                    {selectedShipment.weight ? `${selectedShipment.weight} kg` : "—"}
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700">Expéditeur</div>
                  <div className="text-sm">
                    <div className="font-medium">
                      {selectedShipment.senderName || "Non spécifié"}
                    </div>
                    <div className="text-slate-600">
                      {selectedShipment.senderAddress || "—"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700">Destinataire</div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedShipment.recipientName}</div>
                    <div className="text-slate-600">{selectedShipment.recipientAddress}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  Historique de suivi
                </div>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-4">
                    {selectedShipment.events.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="mt-1">
                          <div className="size-2 rounded-full bg-purple-500" />
                          {index < selectedShipment.events.length - 1 && (
                            <div className="w-0.5 h-full ml-[3px] mt-1 bg-purple-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm">{event.status}</div>
                            <div className="text-xs text-slate-500 whitespace-nowrap">
                              {event.date}
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 mt-1">{event.description}</div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <MapPin className="size-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Open La Poste tracking page
                    window.open(
                      `https://www.laposte.fr/outils/suivre-vos-envois?code=${selectedShipment.trackingNumber}`,
                      "_blank"
                    )
                  }}
                >
                  Voir sur LaPoste.fr
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatsItem({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <Badge variant="secondary" className={colorClasses[color]}>
        {count}
      </Badge>
    </div>
  )
}

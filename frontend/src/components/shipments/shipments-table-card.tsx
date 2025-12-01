"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table-basic"
import { columns as defaultColumns } from "@/app/(main)/expeditions/columns"
import type { ShipmentOrder } from "@/types/shipment"
import { Download, Package, Plus, RefreshCw } from "lucide-react"

interface ShipmentsTableCardProps {
  data: ShipmentOrder[]
  total: number
  columns?: ColumnDef<ShipmentOrder>[]
  onCreateShipment?: () => void
  onRefresh?: () => void
  onExport?: () => void
}

export function ShipmentsTableCard({
  data,
  total,
  columns = defaultColumns,
  onCreateShipment,
  onRefresh,
  onExport,
}: ShipmentsTableCardProps) {
  return (
    <Card className="flex-1 min-h-0 bg-blue-100 border-blue-200">
      <CardHeader className="gap-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-semibold">Commandes & suivi des expéditions</CardTitle>
              <CardDescription>Visualisez les colis pour l&apos;ensemble des clients et filtres actifs.</CardDescription>
            </div>
          </div>
          <CardAction className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Badge variant="secondary" className="w-fit">
              {total.toLocaleString("fr-FR")} expédition(s)
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              {onRefresh && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={onRefresh}>
                  <RefreshCw className="size-4" />
                  Actualiser
                </Button>
              )}
              {onCreateShipment && (
                <Button size="sm" className="gap-1" onClick={onCreateShipment}>
                  <Plus className="size-4" />
                  Nouvelle expédition
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" className="gap-1" onClick={onExport}>
                  <Download className="size-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-6">
        <DataTable<ShipmentOrder, unknown>
          columns={columns}
          data={data}
          headerClassName="bg-sidebar hover:bg-sidebar"
        />
      </CardContent>
    </Card>
  )
}

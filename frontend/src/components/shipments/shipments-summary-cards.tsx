"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, PackageCheck, PackageSearch, Truck } from "lucide-react"

export interface ShipmentTotals {
  total: number
  inTransit: number
  delivered: number
  delayed: number
}

interface ShipmentsSummaryCardsProps {
  totals: ShipmentTotals
  totalShipments: number
}

const summaryConfig = [
  {
    id: "total" as const,
    label: "Total filtré",
    description: (totalShipments: number) => `Sur ${totalShipments} expéditions au total.`,
    icon: PackageSearch,
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    id: "inTransit" as const,
    label: "En cours",
    description: () => "Statuts expédié, transit ou livraison.",
    icon: Truck,
    iconClassName: "bg-sky-100 text-sky-700",
  },
  {
    id: "delivered" as const,
    label: "Livrées",
    description: () => "Expéditions marquées comme livrées.",
    icon: PackageCheck,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "delayed" as const,
    label: "Retards",
    description: () => "Retards identifiés à surveiller.",
    icon: AlertTriangle,
    iconClassName: "bg-red-100 text-red-700",
    emphasize: true,
  },
] satisfies Array<{
  id: keyof ShipmentTotals
  label: string
  description: (totalShipments: number) => string
  icon: typeof PackageSearch
  iconClassName: string
  emphasize?: boolean
}>

export function ShipmentsSummaryCards({ totals, totalShipments }: ShipmentsSummaryCardsProps) {
  return (
    <div className="grid gap-2 lg:gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {summaryConfig.map(({ id, label, description, icon: Icon, iconClassName, emphasize }) => (
        <Card key={id} className="py-3 gap-2 lg:gap-2">
          <CardHeader className="px-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <CardDescription className="text-sm">{label}</CardDescription>
                <CardTitle className={emphasize ? "text-2xl font-semibold text-destructive" : "text-2xl font-semibold"}>
                  {totals[id].toLocaleString("fr-FR")}
                </CardTitle>
              </div>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
                <Icon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
            {description(totalShipments)}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

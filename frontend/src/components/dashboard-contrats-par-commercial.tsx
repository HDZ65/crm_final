"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, RefreshCw, AlertTriangle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrganisation } from "@/contexts/organisation-context"
import { getContratsParCommercial } from "@/actions/dashboard-contrats-commercial"
import type { ContratsCommercialResponse } from "@/actions/dashboard-contrats-commercial"

interface DashboardContratsParCommercialProps {
  /** Initial data from server - skips client-side fetch if provided */
  initialData?: ContratsCommercialResponse | null
}

export function DashboardContratsParCommercial({ initialData }: DashboardContratsParCommercialProps) {
  const { activeOrganisation } = useOrganisation()
  const [data, setData] = React.useState<ContratsCommercialResponse | null>(initialData || null)
  const [loading, setLoading] = React.useState(!initialData)
  const [error, setError] = React.useState<string | null>(null)
  const hasFetched = React.useRef(!!initialData)

  const fetchData = React.useCallback(async () => {
    if (!activeOrganisation) return

    setLoading(true)
    setError(null)

    const result = await getContratsParCommercial(activeOrganisation.organisationId)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setData(result.data)
    }

    setLoading(false)
  }, [activeOrganisation])

  // Only fetch client-side if no initial data was provided
  React.useEffect(() => {
    if (!hasFetched.current && activeOrganisation) {
      hasFetched.current = true
      fetchData()
    }
  }, [fetchData, activeOrganisation])

  if (!activeOrganisation) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Users className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Sélectionnez une organisation</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-3 p-6">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Erreur de chargement</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </Card>
    )
  }

  if (!data || !data.commerciaux || data.commerciaux.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2 p-6">
        <div className="rounded-full bg-muted p-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Sort by count descending
  const sortedCommerciaux = [...data.commerciaux].sort((a, b) => b.count - a.count)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base md:text-lg">Contrats par Commercial</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData} className="size-8">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedCommerciaux.map((commercial) => (
          <div
            key={commercial.nom}
            className="rounded-lg border bg-background p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate">
                {commercial.nom}
              </span>
              <span className="text-xs font-medium text-muted-foreground shrink-0 ml-2">
                {commercial.count} contrat{commercial.count > 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-lg font-bold text-primary tabular-nums">
              {formatCurrency(commercial.montant)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, FileText, Euro, Users, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useOrganisation } from "@/contexts/organisation-context"
import { getDashboardKpis } from "@/actions/dashboard"
import type { KpisResponse } from "@proto/dashboard/dashboard"

interface KPICard {
  label: string
  value: number
  format: "number" | "currency" | "percentage"
  evolution?: number
  status?: "success" | "warning" | "danger" | "neutral"
}

function transformKpisToCards(kpis: KpisResponse): KPICard[] {
  return [
    {
      label: "Contrats Actifs",
      value: kpis.contratsActifs,
      format: "number",
      evolution: kpis.contratsActifsVariation?.pourcentage,
      status: kpis.contratsActifsVariation?.tendance === "hausse" ? "success" :
              kpis.contratsActifsVariation?.tendance === "baisse" ? "danger" : "neutral",
    },
    {
      label: "MRR",
      value: kpis.mrr,
      format: "currency",
      evolution: kpis.mrrVariation?.pourcentage,
      status: kpis.mrrVariation?.tendance === "hausse" ? "success" :
              kpis.mrrVariation?.tendance === "baisse" ? "danger" : "neutral",
    },
    {
      label: "Taux Churn",
      value: kpis.tauxChurn,
      format: "percentage",
      evolution: kpis.tauxChurnVariation?.pourcentage,
      status: kpis.tauxChurnVariation?.tendance === "baisse" ? "success" :
              kpis.tauxChurnVariation?.tendance === "hausse" ? "danger" : "neutral",
    },
    {
      label: "Taux Impayés",
      value: kpis.tauxImpayes,
      format: "percentage",
      evolution: kpis.tauxImpayesVariation?.pourcentage,
      status: kpis.tauxImpayesVariation?.tendance === "baisse" ? "success" :
              kpis.tauxImpayesVariation?.tendance === "hausse" ? "danger" : "neutral",
    },
  ]
}

interface DashboardKPIsProps {
  /** Initial KPIs data from server - skips client-side fetch if provided */
  initialData?: KpisResponse | null
}

export function DashboardKPIs({ initialData }: DashboardKPIsProps) {
  const { activeOrganisation } = useOrganisation()
  const [kpiCards, setKpiCards] = React.useState<KPICard[]>(
    initialData ? transformKpisToCards(initialData) : []
  )
  const [loading, setLoading] = React.useState(!initialData)
  const [error, setError] = React.useState<string | null>(null)
  const hasFetched = React.useRef(!!initialData)

  const fetchKpis = React.useCallback(async () => {
    if (!activeOrganisation) return

    setLoading(true)
    setError(null)

    const result = await getDashboardKpis({
      organisationId: activeOrganisation.organisationId,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setKpiCards(transformKpisToCards(result.data))
    }

    setLoading(false)
  }, [activeOrganisation])

  // Only fetch client-side if no initial data was provided
  React.useEffect(() => {
    if (!hasFetched.current && activeOrganisation) {
      hasFetched.current = true
      fetchKpis()
    }
  }, [fetchKpis, activeOrganisation])

  const kpiIcons = [FileText, Euro, Users, AlertTriangle]

  if (!activeOrganisation) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
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
        <Button variant="outline" size="sm" onClick={fetchKpis} className="gap-2">
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </Card>
    )
  }

  if (!kpiCards || kpiCards.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2 p-6">
        <div className="rounded-full bg-muted p-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    )
  }

  const formatValue = (value: number | string, format: string) => {
    if (typeof value === "string") return value

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case "percentage":
        return `${value.toFixed(1)}%`
      case "number":
      default:
        return new Intl.NumberFormat("fr-FR").format(value)
    }
  }

  const statusColors = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
    neutral: "text-foreground",
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <CardTitle className="text-base md:text-lg">Indicateurs clés</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchKpis} className="size-8">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {kpiCards.map((kpi, index) => {
          const Icon = kpiIcons[index] || FileText
          return (
            <div
              key={kpi.label}
              className="rounded-lg border bg-background p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {kpi.label}
                </span>
                <Icon className="size-4 text-muted-foreground shrink-0" />
              </div>
              <div className={cn("text-lg font-bold tabular-nums", statusColors[kpi.status || "neutral"])}>
                {formatValue(kpi.value, kpi.format || "number")}
              </div>
              {kpi.evolution !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {kpi.evolution > 0 ? (
                    <>
                      <TrendingUp className="size-3 text-green-600" />
                      <span className="text-green-600">+{kpi.evolution.toFixed(1)}%</span>
                    </>
                  ) : kpi.evolution < 0 ? (
                    <>
                      <TrendingDown className="size-3 text-destructive" />
                      <span className="text-destructive">{kpi.evolution.toFixed(1)}%</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">=</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

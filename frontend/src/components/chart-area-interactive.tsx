"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Maximize2, TrendingUp, Download, Loader2, Euro } from "lucide-react"

import { useIsMobile } from "@/hooks/core"
import { useCAEvolution } from "@/hooks/stats"
import { useOrganisation } from "@/contexts/organisation-context"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Graphique d'évolution du CA"

const chartConfig = {
  ca: {
    label: "CA Réalisé",
    color: "var(--color-chart-1)",
  },
  objectif: {
    label: "Objectif",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { activeOrganisation } = useOrganisation()
  const [timeRange, setTimeRange] = React.useState("90d")

  const { chartData, loading, error } = useCAEvolution({
    filters: activeOrganisation ? { organisationId: activeOrganisation.id } : undefined,
    skip: !activeOrganisation,
  })

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Transform data for the chart and filter by time range
  const filteredData = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    // Filter based on time range
    let dataToShow = chartData
    if (timeRange === "30d") {
      dataToShow = chartData.slice(-1) // Last month
    } else if (timeRange === "7d") {
      dataToShow = chartData.slice(-1) // Last entry (monthly data)
    } else {
      dataToShow = chartData.slice(-3) // Last 3 months
    }

    return dataToShow.map((item) => ({
      mois: item.mois,
      ca: item.ca,
      objectif: item.objectif,
    }))
  }, [chartData, timeRange])

  // Calculate total CA for display
  const totalCA = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.ca, 0)
  }, [filteredData])

  // No organisation selected - show empty state instead of spinner
  if (!activeOrganisation) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Euro className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    )
  }

  // Loading state - only when actually fetching with an organisation
  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Euro className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Erreur de chargement</p>
      </Card>
    )
  }

  // No data state
  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Euro className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    )
  }

  return (
    <Dialog>
      <Card className="@container/card h-full flex flex-col pb-0">
        <CardHeader className="shrink-0">
          <div className="flex items-center gap-3 ">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Euro className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base md:text-lg">
                Évolution du CA
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {totalCA.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          </div>
          <CardDescription>
            <span className="hidden @[540px]/card:block flex items-center gap-1.5">
              <TrendingUp className="size-4" />
              CA réalisé vs objectif
            </span>
            <span className="@[540px]/card:hidden">CA vs objectif</span>
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">3 derniers mois</ToggleGroupItem>
              <ToggleGroupItem value="30d">Dernier mois</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="3 derniers mois" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">3 derniers mois</SelectItem>
                <SelectItem value="30d" className="rounded-lg">Dernier mois</SelectItem>
              </SelectContent>
            </Select>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Agrandir le graphique">
                <Maximize2 className="size-4" />
              </Button>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full h-full"
          >
            <AreaChart className="h-full w-full" data={filteredData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="fillCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-ca)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--color-ca)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillObjectif" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-objectif)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-objectif)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="mois"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    formatter={(value) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value as number)}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="objectif" type="natural" fill="url(#fillObjectif)" stroke="var(--color-objectif)" strokeDasharray="4 4" />
              <Area dataKey="ca" type="natural" fill="url(#fillCA)" stroke="var(--color-ca)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-7xl w-[95vw] p-0 max-h-[85vh] overflow-hidden">
        <div className="flex max-h-[85vh] flex-col bg-slate-100 border-slate-200">
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Euro className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base md:text-lg">
                  Évolution du CA
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Total: {totalCA.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 pt-2 flex-1 min-h-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup type="single" value={timeRange} onValueChange={setTimeRange} variant="outline">
                <ToggleGroupItem value="90d">3 derniers mois</ToggleGroupItem>
                <ToggleGroupItem value="30d">Dernier mois</ToggleGroupItem>
              </ToggleGroup>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40" size="sm">
                  <SelectValue placeholder="3 derniers mois" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="90d" className="rounded-lg">3 derniers mois</SelectItem>
                  <SelectItem value="30d" className="rounded-lg">Dernier mois</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const rows = filteredData.map((d) => ({ mois: d.mois, ca: d.ca, objectif: d.objectif }))
                  const header = "mois,ca,objectif\n"
                  const csv = header + rows.map((r) => `${r.mois},${r.ca},${r.objectif}`).join("\n")
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `evolution_ca_${timeRange}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>

            <div className="bg-white rounded-xl border p-3 flex-1 min-h-0">
              <ChartContainer config={chartConfig} className="aspect-auto h-[65vh] w-full">
                <AreaChart data={filteredData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="fillCADialog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-ca)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--color-ca)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillObjectifDialog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-objectif)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-objectif)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="mois"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => value}
                        formatter={(value) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value as number)}
                        indicator="dot"
                      />
                    }
                  />
                  <Area dataKey="objectif" type="natural" fill="url(#fillObjectifDialog)" stroke="var(--color-objectif)" strokeDasharray="4 4" />
                  <Area dataKey="ca" type="natural" fill="url(#fillCADialog)" stroke="var(--color-ca)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

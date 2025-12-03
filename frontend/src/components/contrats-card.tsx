"use client"

import * as React from "react"
import { Folder, Maximize2, Download, Filter, SortAsc, TrendingUp, FileText } from "lucide-react"
import { useCompanyStats } from "@/hooks/stats"
import { useOrganisation } from "@/contexts/organisation-context"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pie, PieChart, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Calculer les dates de début/fin en fonction de la période
function getPeriodDates(period: string): { dateDebut: string; dateFin: string } {
  const now = new Date()
  const dateFin = now.toISOString().split("T")[0]
  let dateDebut: Date

  switch (period) {
    case "24h":
      dateDebut = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case "7j":
      dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "30j":
      dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      dateDebut = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  return {
    dateDebut: dateDebut.toISOString().split("T")[0],
    dateFin,
  }
}

export function ContratsCard() {
  const { activeOrganisation } = useOrganisation()
  const [sort, setSort] = React.useState<"contracts-desc" | "contracts-asc" | "alpha-asc" | "alpha-desc">("contracts-desc")
  const [period, setPeriod] = React.useState("30j")

  const periodDates = React.useMemo(() => getPeriodDates(period), [period])

  const { tableData, error } = useCompanyStats({
    filters: activeOrganisation
      ? {
          organisationId: activeOrganisation.id,
          dateDebut: periodDates.dateDebut,
          dateFin: periodDates.dateFin,
        }
      : undefined,
    skip: !activeOrganisation,
  })

  // Transformer les données API vers le format attendu
  const contractsData = React.useMemo(() => {
    return tableData.map((item) => ({
      company: item.companyName,
      contracts: item.contratsActifs,
    }))
  }, [tableData])

  const allCompanies = React.useMemo(() => contractsData.map((c) => c.company), [contractsData])
  const [selectedCompanies, setSelectedCompanies] = React.useState<string[]>([])

  // Mettre à jour les sociétés sélectionnées quand les données arrivent
  React.useEffect(() => {
    if (allCompanies.length > 0 && selectedCompanies.length === 0) {
      setSelectedCompanies(allCompanies)
    }
  }, [allCompanies, selectedCompanies.length])

  const toggleCompany = (name: string, checked: boolean | string) => {
    setSelectedCompanies((prev) => {
      const isChecked = !!checked
      if (isChecked) return prev.includes(name) ? prev : [...prev, name]
      return prev.filter((c) => c !== name)
    })
  }

  const filtered = React.useMemo(() => {
    let rows = contractsData.filter((c) => selectedCompanies.includes(c.company))
    rows = rows.slice()
    rows.sort((a, b) => {
      switch (sort) {
        case "contracts-asc":
          return a.contracts - b.contracts
        case "alpha-asc":
          return a.company.localeCompare(b.company)
        case "alpha-desc":
          return b.company.localeCompare(a.company)
        default:
          return b.contracts - a.contracts
      }
    })
    return rows
  }, [contractsData, selectedCompanies, sort])

  const totalContracts = React.useMemo(
    () => filtered.reduce((sum, item) => sum + item.contracts, 0),
    [filtered]
  )

  // No organisation selected - show empty state
  if (!activeOrganisation) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Folder className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Folder className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Erreur de chargement</p>
      </Card>
    )
  }

  // No data state
  if (!tableData || tableData.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center flex-col gap-2">
        <Folder className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    )
  }

  return (
    <Dialog>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Folder className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base font-semibold md:text-lg">Contrats</CardTitle>
              <p className="text-xs text-muted-foreground">
                {totalContracts} contrats au total
              </p>
            </div>
          </div>
          <CardAction className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="24h" className="rounded-lg">Dernière 24h</SelectItem>
                <SelectItem value="7j" className="rounded-lg">7 derniers jours</SelectItem>
                <SelectItem value="30j" className="rounded-lg">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Agrandir la carte">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 pt-4 min-h-0 overflow-hidden">
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2 min-h-0">
            <div className="min-h-0 h-full flex items-center justify-center">
              <ContractsPieLabelDynamic data={filtered} heightClass="h-full max-h-[250px]" />
            </div>
            <div className="min-h-0 overflow-y-auto">
              <div className="space-y-2 pr-2">
                {filtered.map((item, index) => (
                  <div
                    key={item.company}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
                      />
                      <span className="font-medium text-sm truncate">{item.company}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold shrink-0">
                      +{item.contracts}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-7xl w-[95vw] p-0 max-h-[85vh] overflow-hidden">
        <div className="flex max-h-[85vh] flex-col">
          <div className="border-b bg-muted/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Vue détaillée des Contrats</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Analysez et exportez vos données
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {totalContracts} total
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Sociétés
                    <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-xs">
                      {selectedCompanies.length}/{allCompanies.length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrer les sociétés
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {allCompanies.map((name) => (
                      <DropdownMenuCheckboxItem
                        key={name}
                        checked={selectedCompanies.includes(name)}
                        onCheckedChange={(v) => toggleCompany(name, v)}
                        className="capitalize"
                      >
                        {name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSelectedCompanies(allCompanies)}
                    className="font-medium"
                  >
                    Tout sélectionner
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCompanies([])}
                    className="font-medium"
                  >
                    Tout désélectionner
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={sort} onValueChange={(v) => setSort(v as "contracts-desc" | "contracts-asc" | "alpha-asc" | "alpha-desc")}>
                <SelectTrigger className="w-56" size="sm">
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contracts-desc">Contrats décroissant</SelectItem>
                  <SelectItem value="contracts-asc">Contrats croissant</SelectItem>
                  <SelectItem value="alpha-asc">Société A → Z</SelectItem>
                  <SelectItem value="alpha-desc">Société Z → A</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const rows = filtered.map((r) => ({ company: r.company, contracts: r.contracts }))
                  const header = "company,contracts\n"
                  const csv = header + rows.map((r) => `${r.company.replace(/,/g, ' ')},${r.contracts}`).join("\n")
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `contrats_${period}_${sort}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>

              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {filtered.length} société{filtered.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12 min-h-0">
              <div className="lg:col-span-6 min-h-0 rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Répartition des contrats
                </h3>
                <ContractsPieLabelDynamic data={filtered} heightClass="h-[55vh]" />
              </div>
              <div className="lg:col-span-6 min-h-0 rounded-xl border bg-card p-4 shadow-sm overflow-auto">
                <div className="flex items-center justify-between mb-3 sticky top-0 bg-card pb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Liste des sociétés
                  </h3>
                  <Badge variant="outline" className="gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {totalContracts} total
                  </Badge>
                </div>
                <div className="space-y-2">
                  {filtered.map((item, index) => (
                    <div
                      key={item.company}
                      className="flex items-center justify-between rounded-lg border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
                        />
                        <span className="font-medium text-sm">{item.company}</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        +{item.contracts}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ContractsPieLabelDynamic({
  data,
  heightClass,
}: {
  data: { company: string; contracts: number }[]
  heightClass?: string
}) {
  // Reproduit la structure et le style de ChartPieContractsLabel
  const tokenKeys = ["chrome", "safari", "firefox", "edge", "other"] as const
  const colorVars = tokenKeys.map((k) => `var(--color-${k})`)

  const chartData = data.map((d, i) => ({
    browser: d.company,
    visitors: d.contracts,
    fill: colorVars[i % colorVars.length],
  }))

  const chartConfig: ChartConfig = {
    visitors: {
      label: "Contrats",
    },
    chrome: { label: "Chrome", color: "var(--chart-1)" },
    safari: { label: "Safari", color: "var(--chart-2)" },
    firefox: { label: "Firefox", color: "var(--chart-3)" },
    edge: { label: "Edge", color: "var(--chart-4)" },
    other: { label: "Other", color: "var(--chart-5)" },
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={`[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square w-full ${heightClass ?? "h-full"}`}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={chartData} dataKey="visitors" label nameKey="browser">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

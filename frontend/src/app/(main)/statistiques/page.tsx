"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Components
import { StatsFilters } from "@/components/stats/stats-filters"
import { KPICardComponent } from "@/components/stats/kpi-card"
import { ChartCAEvolution } from "@/components/stats/chart-ca-evolution"
import { ChartProductDistribution } from "@/components/stats/chart-product-distribution"
import { ChartCommercialRanking } from "@/components/stats/chart-commercial-ranking"
import { AlertsPanel } from "@/components/stats/alerts-panel"
import { CompanyStatsTable } from "@/components/stats/company-stats-table"

// Hooks
import {
  useStatsFilters,
  useDashboardStats,
  useCommercialKPIs,
} from "@/hooks/stats"

// Icons
import {
  FileText as FileTextIcon,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Users,
} from "lucide-react"

import type { UserRole, StatsFilters as FiltersType } from "@/types/stats"

export default function StatistiquesPage() {
  // Simulated user role - in production, this would come from auth context
  const [userRole] = React.useState<UserRole>("DIRECTION")
  const [activeTab, setActiveTab] = React.useState("vue-direction")

  // Use the stats filters hook
  const { filters, setFilters } = useStatsFilters({
    defaultPeriode: "mois_courant",
  })

  // Adapter function to convert between StatsFilters component format and API format
  const handleFiltersChange = React.useCallback((newFilters: FiltersType) => {
    setFilters(newFilters)
  }, [setFilters])

  // Use the combined dashboard stats hook
  const {
    kpiCards,
    chartCAData,
    chartProductData,
    tableCompanyData,
    alertsList,
    isLoading,
    error,
  } = useDashboardStats({ filters })

  // Use the commercial KPIs hook
  const {
    kpiCards: commercialKpiCards,
    commercialRankings,
    loading: commercialLoading,
    error: commercialError,
  } = useCommercialKPIs({ filters })

  // Show error toast if API fails
  React.useEffect(() => {
    if (error) {
      toast.error("Erreur de chargement", {
        description: error.message || "Impossible de charger les statistiques.",
      })
    }
    if (commercialError) {
      toast.error("Erreur de chargement", {
        description: commercialError.message || "Impossible de charger les KPIs commerciaux.",
      })
    }
  }, [error, commercialError])

  // Icons for KPI cards
  const kpiIcons = [FileTextIcon, DollarSign, TrendingDown, AlertTriangle]
  const commercialKpiIcons = [Users, TrendingDown, DollarSign, DollarSign]

  return (
    <main className="flex flex-1 flex-col">
      <div
        className="min-h-0 flex-1 gap-4 flex flex-col overflow-hidden"
        style={{ height: "calc(100dvh - var(--header-height))" }}
      >
        {/* En-tête avec filtres et actions */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          <div className="flex-1">
            <StatsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              userRole={userRole}
            />
          </div>
        </div>

        {/* Contenu principal avec tabs */}
        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="">
            <TabsList className="mb-4">
              <TabsTrigger value="vue-direction">Vue Direction</TabsTrigger>
              <TabsTrigger value="vue-commerciale">Vue Commerciale</TabsTrigger>
              <TabsTrigger value="vue-risques">Risques & Qualité</TabsTrigger>
            </TabsList>

            {/* Vue Direction */}
            <TabsContent value="vue-direction" className="space-y-4">
              {/* KPIs principaux */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                  // Loading skeleton for KPIs
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[120px] rounded-lg border bg-card animate-pulse"
                    />
                  ))
                ) : kpiCards.length > 0 ? (
                  kpiCards.map((kpi, index) => (
                    <KPICardComponent
                      key={kpi.label}
                      {...kpi}
                      icon={kpiIcons[index] || FileTextIcon}
                    />
                  ))
                ) : (
                  // Fallback when no data
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[120px] rounded-lg border bg-card flex items-center justify-center text-muted-foreground"
                    >
                      Aucune donnée
                    </div>
                  ))
                )}
              </div>

              {/* Graphiques principaux et alertes */}
              <div className="grid gap-4 lg:grid-cols-3">
                {isLoading ? (
                  <>
                    <div className="lg:col-span-1 h-[300px] rounded-lg border bg-card animate-pulse" />
                    <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                    <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                  </>
                ) : (
                  <>
                    <ChartCAEvolution data={chartCAData} />
                    <ChartProductDistribution data={chartProductData} />
                    <AlertsPanel alerts={alertsList} />
                  </>
                )}
              </div>

              {/* Tableau sociétés */}
              {isLoading ? (
                <div className="h-[400px] rounded-lg border bg-card animate-pulse" />
              ) : (
                <CompanyStatsTable data={tableCompanyData} />
              )}
            </TabsContent>

            {/* Vue Commerciale */}
            <TabsContent value="vue-commerciale" className="space-y-4">
              {/* KPIs commerciaux */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {commercialLoading ? (
                  // Loading skeleton for KPIs
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[120px] rounded-lg border bg-card animate-pulse"
                    />
                  ))
                ) : commercialKpiCards.length > 0 ? (
                  commercialKpiCards.map((kpi, index) => (
                    <KPICardComponent
                      key={kpi.label}
                      {...kpi}
                      icon={commercialKpiIcons[index] || FileTextIcon}
                    />
                  ))
                ) : (
                  // Fallback when no data
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[120px] rounded-lg border bg-card flex items-center justify-center text-muted-foreground"
                    >
                      Aucune donnée
                    </div>
                  ))
                )}
              </div>

              {/* Classements commerciaux */}
              <div className="grid gap-4 lg:grid-cols-3">
                {commercialLoading ? (
                  <>
                    <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                    <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                    <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                  </>
                ) : (
                  <>
                    <ChartCommercialRanking
                      data={commercialRankings}
                      metric="ventes"
                    />
                    <ChartCommercialRanking
                      data={commercialRankings}
                      metric="ca"
                    />
                    <ChartCommercialRanking
                      data={commercialRankings}
                      metric="tauxConversion"
                    />
                  </>
                )}
              </div>
            </TabsContent>

            {/* Vue Risques & Qualité */}
            <TabsContent value="vue-risques" className="space-y-4">
              {/* KPIs Risques */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KPICardComponent
                  label="Contrats en attente CQ"
                  value={142}
                  format="number"
                  status="warning"
                  icon={FileTextIcon}
                />
                <KPICardComponent
                  label="Taux de rejet CQ"
                  value={8.3}
                  evolution={1.2}
                  format="percentage"
                  status="warning"
                  icon={AlertTriangle}
                />
                <KPICardComponent
                  label="Montant impayés"
                  value={26700}
                  evolution={-2.4}
                  format="currency"
                  status="warning"
                  icon={DollarSign}
                />
              </div>

              {/* Alertes détaillées */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                  ) : (
                    <ChartCAEvolution data={chartCAData} />
                  )}
                </div>
                {isLoading ? (
                  <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
                ) : (
                  <AlertsPanel alerts={alertsList} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

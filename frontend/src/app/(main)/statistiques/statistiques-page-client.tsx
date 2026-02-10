"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Components
import { StatsFiltersComponent as StatsFilters } from "@/components/stats/stats-filters"
import { KPICardComponent } from "@/components/stats/kpi-card"
import { ChartCAEvolution } from "@/components/stats/chart-ca-evolution"
import { ChartProductDistribution } from "@/components/stats/chart-product-distribution"
import { ChartCommercialRanking } from "@/components/stats/chart-commercial-ranking"
import { AlertsPanel } from "@/components/stats/alerts-panel"
import { CompanyStatsTable } from "@/components/stats/company-stats-table"

// Server Actions
import {
  getDashboardData,
  getKpisCommerciaux,
  getAlertes,
} from "@/actions/dashboard"

// Hooks - keep useStatsFilters for state management
import { useStatsFilters } from "@/hooks/stats"

// Icons
import {
  FileText as FileTextIcon,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Users,
  Percent,
} from "lucide-react"

import type { UserRole, StatsFilters as FiltersType, KPICard, CommercialRanking, CAEvolution, ProductStats, Alert, CompanyStats } from "@/types/stats"
import type { DashboardFilters, KpisResponse, EvolutionCaResponse, RepartitionProduitsResponse, StatsSocietesResponse, KpisCommerciauxResponse, AlertesResponse } from "@proto/dashboard/dashboard"

// Type for action results
type DashboardActionResult<T> = { data: T | null; error: string | null }

interface StatistiquesPageClientProps {
  initialDashboard?: {
    kpis: DashboardActionResult<KpisResponse>
    evolutionCa: DashboardActionResult<EvolutionCaResponse>
    repartitionProduits: DashboardActionResult<RepartitionProduitsResponse>
    statsSocietes: DashboardActionResult<StatsSocietesResponse>
  }
  initialKpisCommerciaux?: KpisCommerciauxResponse | null
  initialAlertes?: AlertesResponse | null
}

export function StatistiquesPageClient({
  initialDashboard,
  initialKpisCommerciaux,
  initialAlertes,
}: StatistiquesPageClientProps) {
  // Simulated user role - in production, this would come from auth context
  const [userRole] = React.useState<UserRole>("DIRECTION")
  const [activeTab, setActiveTab] = React.useState("vue-direction")

  // Refs to track if we've already fetched (skip if SSR data provided)
  const hasFetchedDashboard = React.useRef(!!initialDashboard?.kpis?.data)
  const hasFetchedCommercial = React.useRef(!!initialKpisCommerciaux)

  // Use the stats filters hook
  const { filters, setFilters } = useStatsFilters({
    defaultPeriode: "mois_courant",
  })

  // Helper functions to transform data (extracted to allow SSR data initialization)
  const transformKpisToCards = React.useCallback((kpis: KpisResponse, alertCount: number): KPICard[] => [
    {
      label: "Contrats actifs",
      value: kpis.contratsActifs,
      evolution: kpis.contratsActifsVariation?.pourcentage || 0,
      format: "number" as const,
      status: (kpis.contratsActifsVariation?.tendance === "hausse" ? "success" : kpis.contratsActifsVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
    },
    {
      label: "CA récurrent (MRR)",
      value: kpis.mrr,
      evolution: kpis.mrrVariation?.pourcentage || 0,
      format: "currency" as const,
      status: (kpis.mrrVariation?.tendance === "hausse" ? "success" : kpis.mrrVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
    },
    {
      label: "Taux de churn",
      value: kpis.tauxChurn,
      evolution: kpis.tauxChurnVariation?.pourcentage || 0,
      format: "percentage" as const,
      status: (kpis.tauxChurnVariation?.tendance === "baisse" ? "success" : kpis.tauxChurnVariation?.tendance === "hausse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
    },
    {
      label: "Alertes actives",
      value: alertCount,
      format: "number" as const,
      status: alertCount > 0 ? "warning" as const : "success" as const,
    },
  ], [])

  const transformAlertesToList = React.useCallback((alertesData: AlertesResponse): Alert[] => {
    const typeMap: Record<string, "impaye" | "churn" | "cq" | "doublon"> = {
      "taux_impayes": "impaye",
      "taux_churn": "churn",
      "controles_qualite": "cq",
      "doublon": "doublon",
    }
    const severityMap: Record<string, "warning" | "danger"> = {
      "critique": "danger",
      "avertissement": "warning",
      "info": "warning",
    }
    return alertesData.alertes.map(a => ({
      id: a.id,
      type: typeMap[a.type] || "cq",
      severity: severityMap[a.niveau] || "warning",
      title: a.titre,
      description: a.description,
      value: a.valeurActuelle,
      threshold: a.seuil,
      date: new Date(a.dateDetection),
    }))
  }, [])

  // Dashboard data state - initialize with SSR data if available
  const [kpiCards, setKpiCards] = React.useState<KPICard[]>(() => {
    if (initialDashboard?.kpis?.data && initialAlertes) {
      return transformKpisToCards(initialDashboard.kpis.data, initialAlertes.total || 0)
    }
    return []
  })
  const [chartCAData, setChartCAData] = React.useState<CAEvolution[]>(() => {
    if (initialDashboard?.evolutionCa?.data) {
      return initialDashboard.evolutionCa.data.donnees.map(p => ({
        mois: p.mois,
        ca: p.caRealise,
        objectif: p.objectif,
      }))
    }
    return []
  })
  const [chartProductData, setChartProductData] = React.useState<ProductStats[]>(() => {
    if (initialDashboard?.repartitionProduits?.data) {
      return initialDashboard.repartitionProduits.data.produits.map(r => ({
        produit: r.nomProduit,
        contratsActifs: 0,
        ca: r.ca,
        nouveauxClients: 0,
      }))
    }
    return []
  })
  const [tableCompanyData, setTableCompanyData] = React.useState<CompanyStats[]>(() => {
    if (initialDashboard?.statsSocietes?.data) {
      return initialDashboard.statsSocietes.data.societes.map(s => ({
        companyId: s.societeId,
        companyName: s.nomSociete,
        contratsActifs: s.contratsActifs,
        mrr: s.mrr,
        arr: s.arr,
        nouveauxClients: s.nouveauxClients,
        tauxChurn: s.tauxChurn,
        tauxImpayes: s.tauxImpayes,
      }))
    }
    return []
  })
  const [alertsList, setAlertsList] = React.useState<Alert[]>(() => {
    if (initialAlertes) {
      return transformAlertesToList(initialAlertes)
    }
    return []
  })
  const [error, setError] = React.useState<Error | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Commercial KPIs state - initialize with SSR data if available
  const [commercialKpiCards, setCommercialKpiCards] = React.useState<KPICard[]>(() => {
    if (initialKpisCommerciaux) {
      const data = initialKpisCommerciaux
      return [
        {
          label: "Nouveaux clients (mois)",
          value: data.nouveauxClientsMois,
          evolution: data.nouveauxClientsVariation?.pourcentage || 0,
          format: "number" as const,
          status: (data.nouveauxClientsVariation?.tendance === "hausse" ? "success" : data.nouveauxClientsVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "Taux de conversion",
          value: data.tauxConversion,
          evolution: data.tauxConversionVariation?.pourcentage || 0,
          format: "percentage" as const,
          status: (data.tauxConversionVariation?.tendance === "hausse" ? "success" : data.tauxConversionVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "Panier moyen",
          value: data.panierMoyen,
          evolution: data.panierMoyenVariation?.pourcentage || 0,
          format: "currency" as const,
          status: (data.panierMoyenVariation?.tendance === "hausse" ? "success" : data.panierMoyenVariation?.tendance === "baisse" ? "warning" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "CA prévisionnel (3 mois)",
          value: data.caPrevisionnel3Mois,
          format: "currency" as const,
          status: "neutral" as const,
        },
      ]
    }
    return []
  })
  const [commercialRankings, setCommercialRankings] = React.useState<CommercialRanking[]>(() => {
    if (initialKpisCommerciaux) {
      const data = initialKpisCommerciaux
      return data.classementParVentes.map(item => {
        const caItem = data.classementParCa.find(c => c.commercialId === item.commercialId)
        const conversionItem = data.classementParConversion.find(c => c.commercialId === item.commercialId)
        return {
          userId: item.commercialId,
          name: item.nomComplet,
          ventes: item.valeur,
          ca: caItem?.valeur || 0,
          tauxConversion: conversionItem?.valeur || 0,
          panierMoyen: caItem && item.valeur > 0 ? caItem.valeur / item.valeur : 0,
        }
      })
    }
    return []
  })
  const [commercialError, setCommercialError] = React.useState<Error | null>(null)
  const [commercialLoading, setCommercialLoading] = React.useState(false)

  // Adapter function to convert between StatsFilters component format and API format
  const handleFiltersChange = React.useCallback((newFilters: FiltersType) => {
    setFilters(newFilters)
  }, [setFilters])

  // Convert frontend filters to gRPC format
  const grpcFilters: DashboardFilters = React.useMemo(() => ({
    organisationId: filters.organisationId || "",
    periodeRapide: filters.periodeRapide || "mois_courant",
    dateDebut: filters.dateDebut || "",
    dateFin: filters.dateFin || "",
    societeId: filters.societeId || "",
    produitId: filters.produitId || "",
  }), [filters])

  // Fetch dashboard data
  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const [dashboardResult, alertesResult] = await Promise.all([
      getDashboardData(grpcFilters),
      getAlertes(grpcFilters),
    ])

    if (dashboardResult.kpis.error || dashboardResult.evolutionCa.error || dashboardResult.repartitionProduits.error || dashboardResult.statsSocietes.error) {
      setError(new Error(dashboardResult.kpis.error || dashboardResult.evolutionCa.error || dashboardResult.repartitionProduits.error || dashboardResult.statsSocietes.error || "Erreur"))
    }

    // Map KPIs response to KPICard format
    // gRPC types: contratsActifs, mrr, tauxChurn, tauxImpayes (with Variations)
    if (dashboardResult.kpis.data) {
      const kpis = dashboardResult.kpis.data
      const alertCount = alertesResult.data?.total || 0
      setKpiCards([
        {
          label: "Contrats actifs",
          value: kpis.contratsActifs,
          evolution: kpis.contratsActifsVariation?.pourcentage || 0,
          format: "number" as const,
          status: (kpis.contratsActifsVariation?.tendance === "hausse" ? "success" : kpis.contratsActifsVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "CA récurrent (MRR)",
          value: kpis.mrr,
          evolution: kpis.mrrVariation?.pourcentage || 0,
          format: "currency" as const,
          status: (kpis.mrrVariation?.tendance === "hausse" ? "success" : kpis.mrrVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "Taux de churn",
          value: kpis.tauxChurn,
          evolution: kpis.tauxChurnVariation?.pourcentage || 0,
          format: "percentage" as const,
          status: (kpis.tauxChurnVariation?.tendance === "baisse" ? "success" : kpis.tauxChurnVariation?.tendance === "hausse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "Alertes actives",
          value: alertCount,
          format: "number" as const,
          status: alertCount > 0 ? "warning" as const : "success" as const,
        },
      ])
    }

    // Map evolution CA to CAEvolution type
    // gRPC types: periodeDebut, periodeFin, donnees[].mois, donnees[].caRealise, donnees[].objectif
    // Component expects: { mois: string; ca: number; objectif: number }
    if (dashboardResult.evolutionCa.data) {
      setChartCAData(dashboardResult.evolutionCa.data.donnees.map(p => ({
        mois: p.mois,
        ca: p.caRealise,
        objectif: p.objectif,
      })))
    }

    // Map product distribution to ProductStats type
    // gRPC types: caTotal, produits[].produitId, produits[].nomProduit, produits[].ca, produits[].pourcentage, produits[].couleur
    // Component expects: { produit: string; contratsActifs: number; ca: number; nouveauxClients: number }
    if (dashboardResult.repartitionProduits.data) {
      setChartProductData(dashboardResult.repartitionProduits.data.produits.map(r => ({
        produit: r.nomProduit,
        contratsActifs: 0, // Not available in gRPC response
        ca: r.ca,
        nouveauxClients: 0, // Not available in gRPC response
      })))
    }

    // Map company stats to CompanyStats type
    // gRPC types: societeId, nomSociete, contratsActifs, mrr, arr, nouveauxClients, tauxChurn, tauxImpayes
    // Component expects: { companyId, companyName, contratsActifs, mrr, arr, nouveauxClients, tauxChurn, tauxImpayes }
    if (dashboardResult.statsSocietes.data) {
      setTableCompanyData(dashboardResult.statsSocietes.data.societes.map(s => ({
        companyId: s.societeId,
        companyName: s.nomSociete,
        contratsActifs: s.contratsActifs,
        mrr: s.mrr,
        arr: s.arr,
        nouveauxClients: s.nouveauxClients,
        tauxChurn: s.tauxChurn,
        tauxImpayes: s.tauxImpayes,
      })))
    }

    // Map alertes to Alert type
    // gRPC types: id, titre, description, niveau, type, valeurActuelle, seuil, dateDetection
    // Component expects: { id, type, severity, title, description, value, threshold, date: Date }
    if (alertesResult.data) {
      setAlertsList(alertesResult.data.alertes.map(a => {
        // Map gRPC type to component Alert type
        const typeMap: Record<string, "impaye" | "churn" | "cq" | "doublon"> = {
          "taux_impayes": "impaye",
          "taux_churn": "churn",
          "controles_qualite": "cq",
          "doublon": "doublon",
        }
        const severityMap: Record<string, "warning" | "danger"> = {
          "critique": "danger",
          "avertissement": "warning",
          "info": "warning",
        }
        return {
          id: a.id,
          type: typeMap[a.type] || "cq",
          severity: severityMap[a.niveau] || "warning",
          title: a.titre,
          description: a.description,
          value: a.valeurActuelle,
          threshold: a.seuil,
          date: new Date(a.dateDetection),
        }
      }))
    }

    setIsLoading(false)
  }, [grpcFilters])

  // Fetch commercial KPIs
  const fetchCommercialKpis = React.useCallback(async () => {
    setCommercialLoading(true)
    setCommercialError(null)

    const result = await getKpisCommerciaux(grpcFilters)

    if (result.error) {
      setCommercialError(new Error(result.error))
    } else if (result.data) {
      const data = result.data
      // Map to KPICard format
      setCommercialKpiCards([
        {
          label: "Nouveaux clients (mois)",
          value: data.nouveauxClientsMois,
          evolution: data.nouveauxClientsVariation?.pourcentage || 0,
          format: "number" as const,
          status: (data.nouveauxClientsVariation?.tendance === "hausse" ? "success" : data.nouveauxClientsVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "Taux de conversion",
          value: data.tauxConversion,
          evolution: data.tauxConversionVariation?.pourcentage || 0,
          format: "percentage" as const,
          status: (data.tauxConversionVariation?.tendance === "hausse" ? "success" : data.tauxConversionVariation?.tendance === "baisse" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "Panier moyen",
          value: data.panierMoyen,
          evolution: data.panierMoyenVariation?.pourcentage || 0,
          format: "currency" as const,
          status: (data.panierMoyenVariation?.tendance === "hausse" ? "success" : data.panierMoyenVariation?.tendance === "baisse" ? "warning" : "neutral") as "success" | "warning" | "danger" | "neutral",
        },
        {
          label: "CA prévisionnel (3 mois)",
          value: data.caPrevisionnel3Mois,
          format: "currency" as const,
          status: "neutral" as const,
        },
      ])

      // Map commercial rankings
      setCommercialRankings(data.classementParVentes.map(item => {
        const caItem = data.classementParCa.find(c => c.commercialId === item.commercialId)
        const conversionItem = data.classementParConversion.find(c => c.commercialId === item.commercialId)
        return {
          userId: item.commercialId,
          name: item.nomComplet,
          ventes: item.valeur,
          ca: caItem?.valeur || 0,
          tauxConversion: conversionItem?.valeur || 0,
          panierMoyen: caItem && item.valeur > 0 ? caItem.valeur / item.valeur : 0,
        }
      }))
    }

    setCommercialLoading(false)
  }, [grpcFilters])

  // Initial data fetch - skip if SSR data provided
  React.useEffect(() => {
    if (hasFetchedDashboard.current) return
    hasFetchedDashboard.current = true
    fetchDashboardData()
  }, [fetchDashboardData])

  React.useEffect(() => {
    if (hasFetchedCommercial.current) return
    hasFetchedCommercial.current = true
    fetchCommercialKpis()
  }, [fetchCommercialKpis])

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
  const kpiIcons = [FileTextIcon, DollarSign, Percent, AlertTriangle]
  const commercialKpiIcons = [Users, Percent, DollarSign, DollarSign]

  return (
    <main className="flex flex-1 flex-col">
      <div
        className="min-h-0 flex-1 gap-4 flex flex-col overflow-hidden"
        style={{ height: "calc(100dvh - var(--header-height))" }}
      >
        {/* Filtres */}
        <div className="shrink-0">
          <StatsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
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

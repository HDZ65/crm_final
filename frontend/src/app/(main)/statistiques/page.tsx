import { StatistiquesPageClient } from "./statistiques-page-client"
import { getActiveOrgId } from "@/lib/server-data"
import { getDashboardData, getKpisCommerciaux, getAlertes } from "@/actions/dashboard"
import type { DashboardFilters } from "@proto/dashboard/dashboard"

export default async function StatistiquesPage() {
  const activeOrgId = await getActiveOrgId()

  // Default filters for initial load
  const defaultFilters: DashboardFilters = {
    organisationId: activeOrgId || "",
    periodeRapide: "mois_courant",
    dateDebut: "",
    dateFin: "",
    societeId: "",
    produitId: "",
  }

  // Fetch all initial data server-side in parallel
  const [dashboardResult, kpisCommerciauxResult, alertesResult] = await Promise.all([
    activeOrgId ? getDashboardData(defaultFilters) : Promise.resolve({
      kpis: { data: null, error: null },
      evolutionCa: { data: null, error: null },
      repartitionProduits: { data: null, error: null },
      statsSocietes: { data: null, error: null },
    }),
    activeOrgId ? getKpisCommerciaux(defaultFilters) : Promise.resolve({ data: null, error: null }),
    activeOrgId ? getAlertes(defaultFilters) : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <StatistiquesPageClient
      initialDashboard={dashboardResult}
      initialKpisCommerciaux={kpisCommerciauxResult.data}
      initialAlertes={alertesResult.data}
    />
  )
}

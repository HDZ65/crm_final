import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ContratsCard } from "@/components/contrats-card"
import {
  GreetingBriefing,
  AlertBanners,
  ProductDistribution,
  ActivityFeed,
} from "@/components/dashboard"
import { getServerDashboardData, getActiveOrgId } from "@/lib/server/data"

export default async function Page() {
  // Fetch active organisation ID from cookie
  const activeOrgId = await getActiveOrgId()

  // Fetch all dashboard data server-side in parallel
  const dashboardData = activeOrgId
    ? await getServerDashboardData(activeOrgId)
    : {
        kpis: null,
        evolutionCa: null,
        statsSocietes: null,
        alertes: null,
        repartitionProduits: null,
      }

  return (
    <main className="flex flex-1 flex-col gap-6 min-h-0 p-4 lg:p-6">
      {/* Zone 1: Briefing - Greeting, AI Briefing, Alerts */}
      <section data-testid="zone-briefing" className="space-y-4">
        <GreetingBriefing
          initialKpis={dashboardData.kpis}
          initialAlertes={dashboardData.alertes || { alertes: [], total: 0, nombreCritiques: 0, nombreAvertissements: 0, nombreInfos: 0 }}
        />
        <AlertBanners initialAlertes={dashboardData.alertes || { alertes: [], total: 0, nombreCritiques: 0, nombreAvertissements: 0, nombreInfos: 0 }} />
      </section>

       {/* Zone 2: Overview - KPIs and Charts */}
       <section data-testid="zone-overview" className="grid gap-4 lg:grid-cols-2">
         {/* Graphique CA evolution */}
        <section className="lg:col-span-2">
          <ChartAreaInteractive initialData={dashboardData.evolutionCa?.donnees} />
        </section>

        {/* Répartition par produit */}
        <ProductDistribution initialData={dashboardData.repartitionProduits} />

        {/* Contrats par société (conservé) */}
        <ContratsCard initialData={dashboardData.statsSocietes?.societes} />
      </section>

      {/* Zone 3: Activity Feed */}
      <section data-testid="zone-activity">
        <ActivityFeed />
      </section>
    </main>
  )
}

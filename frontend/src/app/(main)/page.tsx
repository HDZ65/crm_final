import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardKPIs } from "@/components/dashboard-kpis"
import { ContratsCard } from "@/components/contrats-card"
import { AiAssistantFab } from "@/components/ai-assistant-fab"
import { getServerDashboardData, getActiveOrgId } from "@/lib/server-data"

export default async function Page() {
  // Fetch active organisation ID from cookie
  const activeOrgId = await getActiveOrgId()

  // Fetch all dashboard data server-side in parallel
  const dashboardData = activeOrgId
    ? await getServerDashboardData(activeOrgId)
    : { kpis: null, evolutionCa: null, statsSocietes: null }

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Grid responsive 2 colonnes */}
      <div className="grid gap-4 lg:grid-cols-2 flex-1 min-h-0">
        {/* KPIs métier */}
        <section className="flex flex-col min-h-[350px] lg:min-h-0">
          <DashboardKPIs initialData={dashboardData.kpis} />
        </section>

        {/* Contrats */}
        <section className="flex flex-col min-h-[350px] lg:min-h-0">
          <ContratsCard initialData={dashboardData.statsSocietes?.societes} />
        </section>

        {/* Graphique prend toute la largeur */}
        <section className="lg:col-span-2 flex flex-col min-h-[400px] lg:min-h-0">
          <ChartAreaInteractive initialData={dashboardData.evolutionCa?.donnees} />
        </section>
      </div>

      {/* AI Assistant FAB */}
      <AiAssistantFab />
    </main>
  )
}


import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { QuickSearch } from "@/components/quick-search"
import { ContratsCard } from "@/components/contrats-card"
import { SectionCardsAssistant } from "@/components/section-cards-assistant-ia"

export default function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Grid responsive avec hauteur optimale */}
      <section className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr] flex-1 min-h-0">
        {/* Première rangée - Cards compactes */}
        <section className="lg:col-span-1 lg:row-span-1 flex flex-col min-h-[350px] lg:min-h-0">
          <QuickSearch />
        </section>

        <section className="lg:col-span-1 lg:row-span-1 flex flex-col min-h-[350px] lg:min-h-0">
          <ContratsCard />
        </section>

        <section className="lg:col-span-1 lg:row-span-2 flex flex-col h-[600px] lg:h-full overflow-hidden">
          <SectionCardsAssistant />
        </section>

        {/* Graphique prend 2 colonnes sur desktop */}
        <section className="lg:col-span-2 lg:row-span-1 flex flex-col lg:min-h-0">
          <ChartAreaInteractive />
        </section>
      </section>
    </main>
  )
}


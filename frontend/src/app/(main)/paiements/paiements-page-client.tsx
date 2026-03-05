"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoutingPageClient } from "./routing/routing-page-client"
import { ArchivesPageClient } from "./archives/archives-page-client"
import { ExportsPageClient } from "./exports/exports-page-client"
import { PrelevementsView } from "@/components/payments/prelevements-view"
import { CalendrierView } from "@/components/payments/calendrier-view"
import { AnalyticsDashboard } from "@/components/payments/analytics-dashboard"
import { OptimizationPanel } from "@/components/payments/optimization-panel"
import { LotManagement } from "@/components/payments/lot-management"
import { Separator } from "@/components/ui/separator"

interface PaiementsPageClientProps {
  societeId: string
  userId: string
  initialRules: any[] | null
  initialArchives: any[] | null
  initialAlerts: any[] | null
  initialAlertStats: any | null
  initialExportJobs: any[] | null
}

export function PaiementsPageClient({
  societeId,
  userId,
  initialRules,
  initialArchives,
  initialAlerts,
  initialAlertStats,
  initialExportJobs,
}: PaiementsPageClientProps) {
  const [activeTab, setActiveTab] = React.useState("prelevements")

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="text-muted-foreground">
          Gérez vos prélèvements, calendrier, analyses et configuration.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prelevements">Prélèvements</TabsTrigger>
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
          <TabsTrigger value="analyse">Analyse</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="archives-exports">Archives & Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="prelevements" className="mt-4">
          <PrelevementsView societeId={societeId} />
        </TabsContent>

        <TabsContent value="calendrier" className="mt-4">
          <CalendrierView societeId={societeId} />
        </TabsContent>

        <TabsContent value="analyse" className="mt-4">
          <AnalyticsDashboard societeId={societeId} />
          <OptimizationPanel societeId={societeId} />
        </TabsContent>

        <TabsContent value="configuration" className="mt-4">
          <LotManagement societeId={societeId} />
          <Separator className="my-6" />
          <RoutingPageClient
            initialRules={initialRules}
            initialSocieteId={societeId}
          />
        </TabsContent>

        <TabsContent value="archives-exports" className="mt-4">
          <Tabs defaultValue="archives">
            <TabsList>
              <TabsTrigger value="archives">Archives</TabsTrigger>
              <TabsTrigger value="exports">Exports</TabsTrigger>
            </TabsList>
            <TabsContent value="archives" className="mt-4">
              <ArchivesPageClient
                initialArchives={initialArchives}
                initialSocieteId={societeId}
              />
            </TabsContent>
            <TabsContent value="exports" className="mt-4">
              <ExportsPageClient
                initialJobs={initialExportJobs}
                initialSocieteId={societeId}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </main>
  )
}

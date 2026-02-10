"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoutingPageClient } from "./routing/routing-page-client"
import { ArchivesPageClient } from "./archives/archives-page-client"
import { AlertesPageClient } from "./alertes/alertes-page-client"
import { ExportsPageClient } from "./exports/exports-page-client"

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
  const [activeTab, setActiveTab] = React.useState("routing")

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="text-muted-foreground">
          Gérez vos paiements, routage, archives, alertes et exports.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="routing">Routage</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="routing" className="mt-4">
          <RoutingPageClient
            initialRules={initialRules}
            initialSocieteId={societeId}
          />
        </TabsContent>

        <TabsContent value="archives" className="mt-4">
          <ArchivesPageClient
            initialArchives={initialArchives}
            initialSocieteId={societeId}
          />
        </TabsContent>

        <TabsContent value="alertes" className="mt-4">
          <AlertesPageClient
            initialAlerts={initialAlerts}
            initialStats={initialAlertStats}
            initialSocieteId={societeId}
            initialUserId={userId}
          />
        </TabsContent>

        <TabsContent value="exports" className="mt-4">
          <ExportsPageClient
            initialJobs={initialExportJobs}
            initialSocieteId={societeId}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}

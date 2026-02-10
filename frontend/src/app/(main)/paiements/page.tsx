import { listRoutingRules } from "@/actions/routing"
import { listExportJobs } from "@/actions/exports"
import { getAlertStats, listAlerts } from "@/actions/finance-alerts"
import { getServerUserProfile } from "@/lib/auth/auth.server"
import { getActiveOrgId } from "@/lib/server/data"
import { PaiementsPageClient } from "./paiements-page-client"

function getDateRange() {
  const now = new Date()
  const toDate = now.toISOString().split("T")[0]
  const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  return { fromDate, toDate }
}

export default async function PaiementsPage() {
  const [societeId, profile] = await Promise.all([
    getActiveOrgId(),
    getServerUserProfile(),
  ])

  const { fromDate, toDate } = getDateRange()

  const [rulesResult, archivesResult, alertsResult, statsResult, exportsResult] = societeId
    ? await Promise.all([
        listRoutingRules({ societeId, page: 1, limit: 100 } as any),
        listExportJobs({ societeId, status: "COMPLETED", page: 1, limit: 100 } as any),
        listAlerts({ societeId, page: 1, limit: 100 } as any),
        getAlertStats({ societeId, fromDate, toDate } as any),
        listExportJobs({ societeId, page: 1, limit: 100 } as any),
      ])
    : [
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ]

  return (
    <PaiementsPageClient
      societeId={societeId ?? ""}
      userId={profile?.utilisateur?.id ?? ""}
      initialRules={rulesResult.data?.rules ?? null}
      initialArchives={archivesResult.data?.jobs ?? null}
      initialAlerts={alertsResult.data?.alerts ?? null}
      initialAlertStats={statsResult.data ?? null}
      initialExportJobs={exportsResult.data?.jobs ?? null}
    />
  )
}

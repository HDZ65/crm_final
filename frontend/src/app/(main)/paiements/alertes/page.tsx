import { getAlertStats, listAlerts } from "@/actions/finance-alerts"
import { getServerUserProfile } from "@/lib/auth/auth.server"
import { getActiveOrgId } from "@/lib/server/data"
import { AlertesPageClient } from "./alertes-page-client"

function getDateRange() {
  const now = new Date()
  const toDate = now.toISOString().split("T")[0]
  const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  return { fromDate, toDate }
}

export default async function AlertesPage() {
  const [societeId, profile] = await Promise.all([getActiveOrgId(), getServerUserProfile()])
  const { fromDate, toDate } = getDateRange()

  const [alertsResult, statsResult] = societeId
    ? await Promise.all([
        listAlerts({ societeId, page: 1, pageSize: 100 } as any),
        getAlertStats({ societeId, fromDate, toDate } as any),
      ])
    : [{ data: null, error: null }, { data: null, error: null }]

  return (
    <AlertesPageClient
      initialAlerts={alertsResult.data?.alerts}
      initialStats={statsResult.data}
      initialSocieteId={societeId ?? ""}
      initialUserId={profile?.utilisateur?.id ?? ""}
    />
  )
}

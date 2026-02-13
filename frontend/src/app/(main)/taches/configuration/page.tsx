import { ConfigurationRelancesPageClient } from "./configuration-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { listReglesRelance, listHistoriqueRelances } from "@/actions/relance"

export default async function ConfigurationRelancesPage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch initial data server-side in parallel
  const [reglesResult, historiqueResult] = await Promise.all([
    activeOrgId
      ? listReglesRelance(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? listHistoriqueRelances(activeOrgId, { limit: 20 })
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <ConfigurationRelancesPageClient
      initialRegles={reglesResult.data ?? undefined}
      initialHistorique={historiqueResult.data ?? undefined}
      activeOrgId={activeOrgId}
    />
  )
}

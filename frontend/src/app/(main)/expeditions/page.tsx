import { ExpeditionsPageClient } from "./expeditions-page-client"
import { getActiveOrgId } from "@/lib/server-data"
import { getExpeditionsByOrganisation } from "@/actions/expeditions"

export default async function ExpeditionsPage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch expeditions server-side
  const expeditionsResult = activeOrgId
    ? await getExpeditionsByOrganisation({ organisationId: activeOrgId })
    : { data: null, error: null }

  return (
    <ExpeditionsPageClient
      initialExpeditions={expeditionsResult.data?.expeditions}
    />
  )
}

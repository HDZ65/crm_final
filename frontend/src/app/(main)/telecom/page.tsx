import { getActiveOrgId } from "@/lib/server/data"
import { listProvisioningLifecycles, getProvisioningStats } from "@/actions/telecom"
import { TelecomPageClient } from "./telecom-page-client"
import { MOCK_LIFECYCLES, MOCK_STATS } from "@/lib/mock-data/telecom"

export default async function TelecomPage() {
  const societeId = await getActiveOrgId()

  let lifecycles = MOCK_LIFECYCLES
  let total = MOCK_LIFECYCLES.length
  let stats = MOCK_STATS

  if (societeId) {
    const [lifecyclesResult, statsResult] = await Promise.all([
      listProvisioningLifecycles({ organisationId: societeId, page: 1, limit: 20 }),
      getProvisioningStats(societeId),
    ])

    // Use API data if available, otherwise keep mocks
    if (lifecyclesResult.data?.items?.length) {
      lifecycles = lifecyclesResult.data.items
      total = lifecyclesResult.data.total
    }
    if (statsResult.data) {
      stats = statsResult.data
    }
  }

  return (
    <TelecomPageClient
      societeId={societeId ?? "mock-org"}
      initialLifecycles={lifecycles}
      initialTotal={total}
      initialStats={stats}
    />
  )
}

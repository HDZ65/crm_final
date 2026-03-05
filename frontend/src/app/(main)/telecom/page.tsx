import { getActiveOrgId } from "@/lib/server/data"
import { listProvisioningLifecycles, getProvisioningStats } from "@/actions/telecom"
import { TelecomPageClient } from "./telecom-page-client"

export default async function TelecomPage() {
  const societeId = await getActiveOrgId()

  const [lifecyclesResult, statsResult] = societeId
    ? await Promise.all([
        listProvisioningLifecycles({ organisationId: societeId, page: 1, limit: 20 }),
        getProvisioningStats(societeId),
      ])
    : [{ data: null, error: null }, { data: null, error: null }]

  return (
    <TelecomPageClient
      societeId={societeId ?? ""}
      initialLifecycles={lifecyclesResult.data?.items ?? []}
      initialTotal={lifecyclesResult.data?.total ?? 0}
      initialStats={statsResult.data ?? null}
    />
  )
}

import { PSPConfigPageClient } from "./psp-config-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getPSPAccountsSummary } from "@/actions/payments"

export default async function PSPConfigPage() {
  const activeOrgId = await getActiveOrgId()

  const pspSummaryResult = await (activeOrgId
    ? getPSPAccountsSummary(activeOrgId)
    : Promise.resolve({ data: null, error: null }))

  return (
    <PSPConfigPageClient
      activeOrgId={activeOrgId}
      initialPSPSummary={pspSummaryResult.data ?? null}
    />
  )
}

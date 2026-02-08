import { listRoutingRules } from "@/actions/routing"
import { getActiveOrgId } from "@/lib/server/data"
import { RoutingPageClient } from "./routing-page-client"

export default async function RoutingPage() {
  const societeId = await getActiveOrgId()

  const rulesResult = societeId
    ? await listRoutingRules({ societeId, page: 1, pageSize: 100 } as any)
    : { data: null, error: null }

  return (
    <RoutingPageClient
      initialRules={rulesResult.data?.rules}
      initialSocieteId={societeId ?? ""}
    />
  )
}

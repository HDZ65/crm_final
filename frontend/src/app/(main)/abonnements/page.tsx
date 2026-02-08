import { AbonnementsPageClient } from "./abonnements-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { listSubscriptions } from "@/actions/subscriptions"

export default async function AbonnementsPage() {
  const activeOrgId = await getActiveOrgId()

  const result = activeOrgId
    ? await listSubscriptions({ organisationId: activeOrgId })
    : { data: null, error: null }

  return <AbonnementsPageClient initialSubscriptions={result.data?.subscriptions} />
}

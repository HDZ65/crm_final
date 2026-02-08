import { AbonnementsPageClient } from "./abonnements-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { listSubscriptionPlans, listSubscriptions } from "@/actions/subscriptions"

export default async function AbonnementsPage() {
  const activeOrgId = await getActiveOrgId()

  const [subscriptionsResult, plansResult] = await Promise.all([
    activeOrgId
      ? listSubscriptions({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    listSubscriptionPlans(),
  ])

  return (
    <AbonnementsPageClient
      activeOrgId={activeOrgId}
      initialSubscriptions={subscriptionsResult.data?.subscriptions}
      initialPlans={plansResult.data?.plans}
    />
  )
}

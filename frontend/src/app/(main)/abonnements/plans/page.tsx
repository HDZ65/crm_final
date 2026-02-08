import { PlansPageClient } from "./plans-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { listSubscriptionPlans } from "@/actions/subscriptions"

export default async function PlansPage() {
  const activeOrgId = await getActiveOrgId()
  const result = await listSubscriptionPlans()

  return (
    <PlansPageClient
      activeOrgId={activeOrgId}
      initialPlans={result.data?.plans}
    />
  )
}

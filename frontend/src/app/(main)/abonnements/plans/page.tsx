import { PlansPageClient } from "./plans-page-client"
import { listSubscriptionPlans } from "@/actions/subscriptions"

export default async function PlansPage() {
  const result = await listSubscriptionPlans()

  return <PlansPageClient initialPlans={result.data?.plans} />
}

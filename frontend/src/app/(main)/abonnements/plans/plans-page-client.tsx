"use client"

import { AbonnementsPageClient } from "../abonnements-page-client"
import type { SubscriptionPlan } from "@proto/subscriptions/subscriptions"

interface PlansPageClientProps {
  activeOrgId?: string | null
  initialPlans?: SubscriptionPlan[] | null
}

export function PlansPageClient({ activeOrgId, initialPlans }: PlansPageClientProps) {
  return (
    <AbonnementsPageClient
      activeOrgId={activeOrgId}
      initialPlans={initialPlans}
      initialTab="plans"
    />
  )
}

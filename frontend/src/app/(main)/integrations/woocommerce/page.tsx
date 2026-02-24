import { WooCommercePageClient } from "./woocommerce-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import {
  listWooCommerceConfigsByOrganisation,
  listWooCommerceMappings,
  listWooCommerceWebhookEvents,
} from "@/actions/woocommerce"

export default async function WooCommercePage() {
  const activeOrgId = await getActiveOrgId()

  const [configsResult, mappingsResult, webhooksResult] = await Promise.all([
    activeOrgId
      ? listWooCommerceConfigsByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? listWooCommerceMappings({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? listWooCommerceWebhookEvents({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <WooCommercePageClient
      activeOrgId={activeOrgId}
      initialConfigs={configsResult.data?.configs ?? null}
      initialMappings={mappingsResult.data?.mappings}
      initialWebhooks={webhooksResult.data?.events}
    />
  )
}

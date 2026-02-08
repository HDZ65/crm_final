import { WooCommercePageClient } from "./woocommerce-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import {
  getWooCommerceConfigByOrganisation,
  listWooCommerceMappings,
  listWooCommerceWebhookEvents,
} from "@/actions/woocommerce"

export default async function WooCommercePage() {
  const activeOrgId = await getActiveOrgId()

  const [configsResult, mappingsResult, webhooksResult] = await Promise.all([
    activeOrgId
      ? getWooCommerceConfigByOrganisation(activeOrgId)
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
      initialConfigs={configsResult.data ? [configsResult.data] : null}
      initialMappings={mappingsResult.data?.mappings}
      initialWebhooks={webhooksResult.data?.webhooks}
    />
  )
}

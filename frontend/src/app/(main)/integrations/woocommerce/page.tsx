import { WooCommercePageClient } from "./woocommerce-page-client"
import {
  listWooCommerceConfigs,
  listWooCommerceMappings,
  listWooCommerceWebhooks,
} from "@/actions/woocommerce"

export default async function WooCommercePage() {
  const [configsResult, mappingsResult, webhooksResult] = await Promise.all([
    listWooCommerceConfigs(),
    listWooCommerceMappings(),
    listWooCommerceWebhooks(),
  ])

  return (
    <WooCommercePageClient
      initialConfigs={configsResult.data?.configs}
      initialMappings={mappingsResult.data?.mappings}
      initialWebhooks={webhooksResult.data?.webhooks}
    />
  )
}

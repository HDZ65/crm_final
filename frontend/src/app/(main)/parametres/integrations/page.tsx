import { IntegrationsPageClient } from "./integrations-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getWinLeadPlusConfig } from "@/actions/winleadplus"
import { getWooCommerceConfigByOrganisation } from "@/actions/woocommerce"

export default async function IntegrationsPage() {
  const activeOrgId = await getActiveOrgId()

  const [winleadplusResult, woocommerceResult] = await Promise.all([
    activeOrgId
      ? getWinLeadPlusConfig({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getWooCommerceConfigByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <IntegrationsPageClient
      activeOrgId={activeOrgId}
      initialWinLeadPlusConfig={winleadplusResult.data ?? null}
      initialWooCommerceConfig={woocommerceResult.data ?? null}
    />
  )
}

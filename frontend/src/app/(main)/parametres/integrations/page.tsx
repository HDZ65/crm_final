import { IntegrationsPageClient } from "./integrations-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getWinLeadPlusConfig } from "@/actions/winleadplus"
import { getWooCommerceConfigByOrganisation } from "@/actions/woocommerce"
import { getCfastConfig } from "@/actions/cfast"

export default async function IntegrationsPage() {
  const activeOrgId = await getActiveOrgId()

  const [winleadplusResult, woocommerceResult, cfastResult] = await Promise.all([
    activeOrgId
      ? getWinLeadPlusConfig({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getWooCommerceConfigByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getCfastConfig(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <IntegrationsPageClient
      activeOrgId={activeOrgId}
      initialWinLeadPlusConfig={winleadplusResult.data ?? null}
      initialWooCommerceConfig={woocommerceResult.data ?? null}
      initialCfastConfig={cfastResult.data ?? null}
    />
  )
}

import { getActiveOrgId } from "@/lib/server/data"
import {
  listFulfillmentBatches,
  getFulfillmentCutoffConfigByOrganisation,
  getCarrierAccountsByOrganisation,
} from "@/actions/logistics"
import { LotsPageClient } from "./lots-page-client"

export default async function LotsPage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch all 3 data sources in parallel
  const [batchesResult, cutoffResult, carriersResult] = await Promise.all([
    activeOrgId
      ? listFulfillmentBatches({ organisationId: activeOrgId, page: 1, limit: 100 })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getFulfillmentCutoffConfigByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getCarrierAccountsByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <LotsPageClient
      activeOrgId={activeOrgId}
      initialBatches={batchesResult.data?.batches}
      initialCutoff={cutoffResult.data}
      initialCarriers={carriersResult.data?.accounts}
    />
  )
}

import { CommerciauxPageClient } from "./commerciaux-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { syncWinLeadPlusProspects } from "@/actions/winleadplus"

export default async function CommerciauxPage() {
  const activeOrgId = await getActiveOrgId()

  // Trigger WinLeadPlus sync (blocking) before loading data
  if (activeOrgId) {
    try {
      await syncWinLeadPlusProspects({ organisationId: activeOrgId })
    } catch {
      // Sync failure must not prevent page render
    }
  }

  // Fetch commerciaux server-side
  const commerciauxResult = activeOrgId
    ? await getApporteursByOrganisation(activeOrgId)
    : { data: null, error: null }

  return (
    <CommerciauxPageClient
      initialCommerciaux={commerciauxResult.data?.apporteurs}
    />
  )
}

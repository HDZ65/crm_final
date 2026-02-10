import { CommerciauxPageClient } from "./commerciaux-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getApporteursByOrganisation } from "@/actions/commerciaux"

export default async function CommerciauxPage() {
  const activeOrgId = await getActiveOrgId()

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

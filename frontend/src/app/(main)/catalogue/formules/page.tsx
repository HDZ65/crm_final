import { FormulesPageClient } from "./formules-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getProduitsByOrganisation } from "@/actions/catalogue"

export default async function FormulesPage() {
  const activeOrgId = await getActiveOrgId()

  const produitsResult = activeOrgId
    ? await getProduitsByOrganisation({ organisationId: activeOrgId })
    : { data: null, error: null }

  return <FormulesPageClient initialProduits={produitsResult.data?.produits} />
}

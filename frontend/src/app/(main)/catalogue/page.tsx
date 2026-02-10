import { CataloguePageClient } from "./catalogue-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import {
  getGammesByOrganisation,
  getProduitsByOrganisation,
  getSocietesByOrganisation,
} from "@/actions/catalogue"

export default async function CataloguePage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch initial data server-side in parallel
  const [societesResult, gammesResult, produitsResult] = await Promise.all([
    activeOrgId
      ? getSocietesByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getGammesByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getProduitsByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <CataloguePageClient
      initialSocietes={societesResult.data?.societes}
      initialGammes={gammesResult.data?.gammes}
      initialProduits={produitsResult.data?.produits}
    />
  )
}

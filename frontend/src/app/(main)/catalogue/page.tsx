import { CataloguePageClient } from "./catalogue-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import {
  getGammesByOrganisation,
  getProduitsByOrganisation,
  getSocietesByOrganisation,
} from "@/actions/catalogue"

export default async function CataloguePage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch sociétés and gammes in parallel first
  const [societesResult, gammesResult] = await Promise.all([
    activeOrgId
      ? getSocietesByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getGammesByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  // Then fetch products per gamme in parallel (backend needs gammeId)
  const gammesList = gammesResult.data?.gammes ?? []
  const produitsResults = activeOrgId && gammesList.length > 0
    ? await Promise.all(
        gammesList.map(g =>
          getProduitsByOrganisation({ organisationId: activeOrgId, gammeId: g.id })
        )
      )
    : []
  const initialProduits = produitsResults.flatMap((r, i) =>
    (r.data?.produits ?? []).map(p => ({ ...p, gammeId: p.gammeId || gammesList[i].id }))
  )

  return (
    <CataloguePageClient
      initialSocietes={societesResult.data?.societes}
      initialGammes={gammesList}
      initialProduits={initialProduits}
    />
  )
}

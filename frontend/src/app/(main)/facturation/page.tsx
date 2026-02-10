import { getActiveOrgId } from "@/lib/server/data"
import { getStatutFactures, getFacturesByOrganisation } from "@/actions/factures"
import { FacturationPageClient } from "./facturation-page-client"

export default async function FacturationPage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch statuts and factures server-side in parallel
  const [statutsResult, facturesResult] = await Promise.all([
    getStatutFactures(),
    activeOrgId
      ? getFacturesByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  const statuts = statutsResult.data?.statuts ?? []
  const sortedStatuts = statuts.sort((a, b) => a.ordreAffichage - b.ordreAffichage)

  return (
    <FacturationPageClient
      initialFactures={facturesResult.data?.factures}
      statuts={sortedStatuts}
    />
  )
}

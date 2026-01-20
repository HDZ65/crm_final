import { getActiveOrgId } from "@/lib/server-data"
import {
  getStatutsCommission,
  getCommissionsByOrganisation,
  getReprisesByOrganisation,
  getBordereauxByOrganisation,
} from "@/actions/commissions"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { CommissionsPageClient } from "./commissions-page-client"

export default async function CommissionsPage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch all data server-side in parallel
  const [statutsResult, commissionsResult, apporteursResult, reprisesResult, bordereauxResult] = await Promise.all([
    getStatutsCommission(),
    activeOrgId
      ? getCommissionsByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getApporteursByOrganisation(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getReprisesByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getBordereauxByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <CommissionsPageClient
      initialStatuts={statutsResult.data?.statuts ?? []}
      initialCommissions={commissionsResult.data?.commissions}
      initialApporteurs={apporteursResult.data?.apporteurs}
      initialReprises={reprisesResult.data?.reprises}
      initialBordereaux={bordereauxResult.data?.bordereaux}
    />
  )
}

import { getActiveOrgId } from "@/lib/server/data"
import { getServerUserProfile } from "@/lib/auth/auth.server"
import {
  getStatutsCommission,
  getCommissionsByOrganisation,
  getReprisesByOrganisation,
  getBordereauxByOrganisation,
  getContestationsByOrganisation,
} from "@/actions/commissions"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { CommissionsPageClient } from "./commissions-page-client"

export default async function CommissionsPage() {
  const [activeOrgId, profile] = await Promise.all([
    getActiveOrgId(),
    getServerUserProfile(),
  ])

  // Fetch all data server-side in parallel
  const [statutsResult, commissionsResult, apporteursResult, reprisesResult, bordereauxResult, contestationsResult] = await Promise.all([
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
    activeOrgId
      ? getContestationsByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <CommissionsPageClient
      userId={profile?.utilisateur?.id ?? ""}
      initialStatuts={statutsResult.data?.statuts ?? []}
      initialCommissions={commissionsResult.data?.commissions}
      initialApporteurs={apporteursResult.data?.apporteurs}
      initialReprises={reprisesResult.data?.reprises}
      initialBordereaux={bordereauxResult.data?.bordereaux}
      initialContestations={contestationsResult.data?.contestations}
    />
  )
}

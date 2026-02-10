import { getBordereauxByOrganisation } from "@/actions/commissions"
import { getServerUserProfile } from "@/lib/auth/auth.server"
import { getActiveOrgId } from "@/lib/server/data"
import type { Bordereau } from "@proto/commission/commission"
import { ValidationPageClient } from "./validation-page-client"

export default async function ValidationCommissionsPage() {
  const [activeOrgId, profile] = await Promise.all([
    getActiveOrgId(),
    getServerUserProfile(),
  ])

  let bordereaux: Bordereau[] = []
  if (activeOrgId) {
    const bordereauxResult = await getBordereauxByOrganisation({ organisationId: activeOrgId })
    bordereaux = bordereauxResult.data?.bordereaux ?? []
  }

  return (
    <ValidationPageClient
      organisationId={activeOrgId}
      validateurId={profile?.utilisateur?.id ?? ""}
      initialBordereaux={bordereaux}
    />
  )
}

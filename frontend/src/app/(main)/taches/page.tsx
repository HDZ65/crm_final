import { TachesPageClient } from "./taches-page-client"
import { getActiveOrgId } from "@/lib/server-data"
import { listTaches, getTacheStats } from "@/actions/taches"
import { listMembresWithUsers } from "@/actions/membres"

export default async function TachesPage() {
  const activeOrgId = await getActiveOrgId()

  // Fetch initial data server-side in parallel
  const [tachesResult, statsResult, membresResult] = await Promise.all([
    activeOrgId
      ? listTaches({
          organisationId: activeOrgId,
          page: 1,
          limit: 20,
        })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getTacheStats(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? listMembresWithUsers(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <TachesPageClient
      initialTaches={tachesResult.data}
      initialStats={statsResult.data}
      initialMembres={membresResult.data}
    />
  )
}

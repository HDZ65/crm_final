import { getClientsByOrganisation } from "@/actions/clients"
import { getActiveOrgId } from "@/lib/server-data"
import { getServerUserProfile } from "@/lib/auth"
import { ClientsPageClient } from "./clients-page-client"
import { STATUTS_CLIENT } from "@/constants/statuts-client"

export default async function ClientsPage() {
  const [activeOrgIdFromCookie, userProfile] = await Promise.all([
    getActiveOrgId(),
    getServerUserProfile(),
  ])

  const activeOrgId = activeOrgIdFromCookie || userProfile?.organisations?.[0]?.organisationId

  const clientsResult = activeOrgId
    ? await getClientsByOrganisation({ organisationId: activeOrgId })
    : { data: null, error: null }

  const clients = clientsResult.data?.clients || []

  return (
    <ClientsPageClient
      initialClients={clients}
      statuts={[...STATUTS_CLIENT]}
    />
  )
}

import { getStatutClients, getClientsByOrganisation } from "@/actions/clients"
import { getActiveOrgId } from "@/lib/server-data"
import { getServerUserProfile } from "@/lib/auth"
import { ClientsPageClient } from "./clients-page-client"

export default async function ClientsPage() {
  // Fetch organisation ID from cookie and user profile in parallel
  const [activeOrgIdFromCookie, userProfile] = await Promise.all([
    getActiveOrgId(),
    getServerUserProfile(),
  ])

  // Utiliser le cookie ou fallback sur la première organisation de l'utilisateur
  const activeOrgId = activeOrgIdFromCookie || userProfile?.organisations?.[0]?.organisationId

  // Fetch statuts et clients en parallèle
  const [statutsResult, clientsResult] = await Promise.all([
    getStatutClients(),
    activeOrgId
      ? getClientsByOrganisation({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
  ])

  const statuts = statutsResult.data?.statuts || []
  const clients = clientsResult.data?.clients || []

  // Trier les statuts par ordre d'affichage
  const sortedStatuts = statuts.sort((a, b) => a.ordreAffichage - b.ordreAffichage)

  return (
    <ClientsPageClient
      initialClients={clients}
      statuts={sortedStatuts}
    />
  )
}

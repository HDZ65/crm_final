import { getClientsByOrganisation } from "@/actions/clients"
import { getActiveOrgId } from "@/lib/server/data"
import { getServerUserProfile } from "@/lib/auth/auth.server"
import { ClientsPageClient } from "./clients-page-client"
import { STATUTS_CLIENT } from "@/constants/statuts-client"
import { hasWinLeadPlusConfig } from "@/actions/winleadplus"

export default async function ClientsPage() {
   const [activeOrgIdFromCookie, userProfile] = await Promise.all([
     getActiveOrgId(),
     getServerUserProfile(),
   ])

   const activeOrgId = activeOrgIdFromCookie || userProfile?.organisations?.[0]?.organisationId

   const [clientsResult, hasWinLeadPlus] = await Promise.all([
     activeOrgId
       ? getClientsByOrganisation({ organisationId: activeOrgId })
       : Promise.resolve({ data: null, error: null }),
     activeOrgId
       ? hasWinLeadPlusConfig({ organisationId: activeOrgId })
       : Promise.resolve(false),
   ])

   const clients = clientsResult.data?.clients || []

   return (
     <ClientsPageClient
       initialClients={clients}
       statuts={[...STATUTS_CLIENT]}
       hasWinLeadPlus={hasWinLeadPlus}
     />
   )
 }

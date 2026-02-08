import { MessageriePageClient } from "./messagerie-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getMailboxesByOrganisation } from "@/actions/mailbox"

export default async function MessageriePage() {
  const activeOrgId = await getActiveOrgId()

  const result = activeOrgId
    ? await getMailboxesByOrganisation(activeOrgId)
    : { data: null, error: null }

  return <MessageriePageClient initialMailboxes={result.data?.mailboxes} />
}

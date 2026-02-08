import { AgendaPageClient } from "./agenda-page-client"
import { getActiveOrgId } from "@/lib/server/data"

export default async function AgendaPage() {
  const activeOrgId = await getActiveOrgId()

  return <AgendaPageClient initialOrgId={activeOrgId} />
}

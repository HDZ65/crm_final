import { ReunionsPageClient } from "./reunions-page-client"
import { getActiveOrgId } from "@/lib/server/data"

export default async function ReunionsPage() {
  const activeOrgId = await getActiveOrgId()

  return <ReunionsPageClient initialOrgId={activeOrgId} />
}

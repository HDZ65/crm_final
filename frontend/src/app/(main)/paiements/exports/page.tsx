import { listExportJobs } from "@/actions/exports"
import { getActiveOrgId } from "@/lib/server/data"
import { ExportsPageClient } from "./exports-page-client"

export default async function ExportsPage() {
  const societeId = await getActiveOrgId()

  const exportsResult = societeId
    ? await listExportJobs({ societeId, page: 1, pageSize: 100 } as any)
    : { data: null, error: null }

  return (
    <ExportsPageClient
      initialJobs={exportsResult.data?.jobs}
      initialSocieteId={societeId ?? ""}
    />
  )
}

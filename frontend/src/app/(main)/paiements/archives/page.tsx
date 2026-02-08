import { listExportJobs } from "@/actions/exports"
import { getActiveOrgId } from "@/lib/server/data"
import { ArchivesPageClient } from "./archives-page-client"

export default async function ArchivesPage() {
  const societeId = await getActiveOrgId()

  const archivesResult = societeId
    ? await listExportJobs({ societeId, status: "COMPLETED", page: 1, pageSize: 100 } as any)
    : { data: null, error: null }

  return (
    <ArchivesPageClient
      initialArchives={archivesResult.data?.jobs}
      initialSocieteId={societeId ?? ""}
    />
  )
}

import { ArchivesPageClient } from "./archives-page-client"

export default async function ArchivesPage() {
  // Archives page is read-only — data will be fetched client-side with filters
  return <ArchivesPageClient />
}

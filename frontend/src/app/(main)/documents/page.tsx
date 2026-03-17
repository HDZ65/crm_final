import { listDocumentsGED } from "@/actions/documents"
import { DocumentsPageClient } from "./documents-page-client"

export default async function DocumentsPage() {
  // Fetch documents server-side
  const documentsResult = await listDocumentsGED()

  return (
    <DocumentsPageClient
      initialDocuments={documentsResult.data?.pieces}
    />
  )
}

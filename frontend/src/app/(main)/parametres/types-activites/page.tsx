import { TypesActivitesPageClient } from "./types-activites-page-client"
import { listTypesActivite } from "@/actions/type-activites"

export default async function TypesActivitesPage() {
  const result = await listTypesActivite()

  return <TypesActivitesPageClient initialTypes={result.data} />
}

import { MarqueBlanchePageClient } from "../marque-blanche-page-client"
import {
  listStatutsPartenaire,
} from "@/actions/marque-blanche"

export default async function StatutsPage() {
  const statutsResult = await listStatutsPartenaire()
  return (
    <MarqueBlanchePageClient
      initialStatuts={statutsResult.data?.statuts}
      section="statuts"
    />
  )
}

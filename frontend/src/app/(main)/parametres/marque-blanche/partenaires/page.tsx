import { MarqueBlanchePageClient } from "../marque-blanche-page-client"
import {
  listPartenairesMarqueBlanche,
  listThemesMarque,
  listStatutsPartenaire,
} from "@/actions/marque-blanche"

export default async function PartenairesPage() {
  const [partenairesResult, themesResult, statutsResult] = await Promise.all([
    listPartenairesMarqueBlanche(),
    listThemesMarque(),
    listStatutsPartenaire(),
  ])
  return (
    <MarqueBlanchePageClient
      initialPartenaires={partenairesResult.data?.partenaires}
      initialThemes={themesResult.data?.themes}
      initialStatuts={statutsResult.data?.statuts}
      section="partenaires"
    />
  )
}

import { MarqueBlanchePageClient } from "../marque-blanche-page-client"
import {
  listThemesMarque,
} from "@/actions/marque-blanche"

export default async function ThemesPage() {
  const themesResult = await listThemesMarque()
  return (
    <MarqueBlanchePageClient
      initialThemes={themesResult.data?.themes}
      section="themes"
    />
  )
}

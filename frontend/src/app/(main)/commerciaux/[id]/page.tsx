import { getApporteur } from "@/actions/commerciaux"
import { getCommissionsByOrganisation, getBordereauxByOrganisation } from "@/actions/commissions"
import { getContratsByOrganisation } from "@/actions/contrats"
import { getActiveOrgId } from "@/lib/server/data"
import { CommercialDetailClient } from "./commercial-detail-client"

interface CommercialDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CommercialDetailPage({ params }: CommercialDetailPageProps) {
  const { id } = await params
  const organisationId = await getActiveOrgId()

  // Fetch all data in parallel
  const [commercialResult, commissionsResult, bordereauxResult, contratsResult] = await Promise.all([
    getApporteur(id),
    organisationId ? getCommissionsByOrganisation({ organisationId, apporteurId: id }) : Promise.resolve({ data: null, error: null }),
    organisationId ? getBordereauxByOrganisation({ organisationId, apporteurId: id }) : Promise.resolve({ data: null, error: null }),
    organisationId ? getContratsByOrganisation({ organisationId, commercialId: id }) : Promise.resolve({ data: null, error: null }),
  ])

  // Handle errors gracefully
  if (commercialResult.error || !commercialResult.data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Commercial introuvable</p>
      </main>
    )
  }

  return (
    <CommercialDetailClient
      commercialId={id}
      organisationId={organisationId || ""}
      initialCommercial={commercialResult.data}
      initialCommissions={commissionsResult.data?.commissions}
      initialBordereaux={bordereauxResult.data?.bordereaux}
      initialContrats={contratsResult.data?.contrats}
    />
  )
}

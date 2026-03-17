import { getProvisioningLifecycle } from "@/actions/telecom"
import { TelecomDetailClient } from "./telecom-detail-client"
import { MOCK_LIFECYCLES } from "@/lib/mock-data/telecom"
import Link from "next/link"

interface TelecomDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TelecomDetailPage({ params }: TelecomDetailPageProps) {
  const { id } = await params
  const result = await getProvisioningLifecycle(id)

  // Données API si disponibles, sinon fallback mock
  const lifecycle = result.data?.lifecycle || MOCK_LIFECYCLES.find((l) => l.id === id)

  if (!lifecycle) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Cycle d’activation introuvable</p>
        <Link href="/telecom" className="text-sm text-primary underline">
          Retour à la liste
        </Link>
      </main>
    )
  }

  return (
    <TelecomDetailClient
      lifecycleId={id}
      initialLifecycle={lifecycle}
    />
  )
}

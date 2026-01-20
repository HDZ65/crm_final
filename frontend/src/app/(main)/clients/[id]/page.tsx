import { getClient, getStatutClients } from "@/actions/clients"
import { getClientExpeditions } from "@/actions/expeditions"
import { ClientDetailClient } from "./client-detail-client"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  // Fetch all data in parallel
  const [clientResult, statutsResult, expeditionsResult] = await Promise.all([
    getClient(id),
    getStatutClients(),
    getClientExpeditions(id),
  ])

  const client = clientResult.data ?? null
  const statuts = statutsResult.data?.statuts ?? []
  const expeditions = expeditionsResult.data?.expeditions ?? []

  // Sort statuts by display order
  const sortedStatuts = statuts.sort((a, b) => a.ordreAffichage - b.ordreAffichage)

  return (
    <ClientDetailClient
      clientId={id}
      initialClient={client}
      initialExpeditions={expeditions}
      statuts={sortedStatuts}
    />
  )
}

import { getClient } from "@/actions/clients"
import { getClientExpeditions } from "@/actions/expeditions"
import { ClientDetailClient } from "./client-detail-client"
import { STATUTS_CLIENT } from "@/constants/statuts-client"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  const [clientResult, expeditionsResult] = await Promise.all([
    getClient(id),
    getClientExpeditions(id),
  ])

  const client = clientResult.data ?? null
  const expeditions = expeditionsResult.data?.expeditions ?? []

  return (
    <ClientDetailClient
      clientId={id}
      initialClient={client}
      initialExpeditions={expeditions}
      statuts={[...STATUTS_CLIENT]}
    />
  )
}

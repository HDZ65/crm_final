import { getProvisioningLifecycle } from "@/actions/telecom"
import { TelecomDetailClient } from "./telecom-detail-client"
import Link from "next/link"

interface TelecomDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TelecomDetailPage({ params }: TelecomDetailPageProps) {
  const { id } = await params
  const result = await getProvisioningLifecycle(id)

  if (result.error || !result.data?.lifecycle) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Cycle de provisioning introuvable</p>
        <Link href="/telecom" className="text-sm text-primary underline">
          Retour à la liste
        </Link>
      </main>
    )
  }

  return (
    <TelecomDetailClient
      lifecycleId={id}
      initialLifecycle={result.data.lifecycle}
    />
  )
}

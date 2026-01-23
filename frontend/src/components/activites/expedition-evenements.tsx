"use client"

import * as React from "react"
import { EvenementsSuiviTimeline } from "./evenements-suivi-timeline"
import { listEvenementsSuiviByExpedition } from "@/actions/evenements-suivi"
import type { EvenementSuiviDto } from "@/types/activite"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ExpeditionEvenementsProps {
  expeditionId: string
}

export function ExpeditionEvenements({ expeditionId }: ExpeditionEvenementsProps) {
  const [evenements, setEvenements] = React.useState<EvenementSuiviDto[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const result = await listEvenementsSuiviByExpedition(expeditionId)

    if (result.data) {
      setEvenements(result.data.data)
    }
    setLoading(false)
  }, [expeditionId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <Card className="h-80">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <EvenementsSuiviTimeline
      evenements={evenements}
      title="Suivi de l'expédition"
      emptyMessage="Aucun événement de suivi pour cette expédition"
    />
  )
}

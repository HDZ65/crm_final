"use client"

import * as React from "react"
import { ActivitesTimeline } from "./activites-timeline"
import { ActiviteDialog } from "./activite-dialog"
import { listActivitesByClient } from "@/actions/activites"
import { listTypesActivite } from "@/actions/type-activites"
import type { ActiviteDto, TypeActiviteDto } from "@/types/activite"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ClientActivitesProps {
  clientId: string
}

export function ClientActivites({ clientId }: ClientActivitesProps) {
  const [activites, setActivites] = React.useState<ActiviteDto[]>([])
  const [typesActivite, setTypesActivite] = React.useState<TypeActiviteDto[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedActivite, setSelectedActivite] = React.useState<ActiviteDto | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const [activitesResult, typesResult] = await Promise.all([
      listActivitesByClient(clientId),
      listTypesActivite(),
    ])

    if (activitesResult.data) {
      setActivites(activitesResult.data.data)
    }
    if (typesResult.data) {
      setTypesActivite(typesResult.data)
    }
    setLoading(false)
  }, [clientId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddActivite = () => {
    setSelectedActivite(null)
    setDialogOpen(true)
  }

  const handleEditActivite = (activite: ActiviteDto) => {
    setSelectedActivite(activite)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <Card className="h-96">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ActivitesTimeline
        activites={activites}
        typesActivite={typesActivite}
        onAddActivite={handleAddActivite}
        onEditActivite={handleEditActivite}
        title="Activités client"
        emptyMessage="Aucune activité enregistrée pour ce client"
      />

      <ActiviteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activite={selectedActivite}
        typesActivite={typesActivite}
        clientBaseId={clientId}
        onSuccess={fetchData}
      />
    </>
  )
}

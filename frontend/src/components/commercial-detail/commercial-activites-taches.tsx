"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import {
  listActivitesByPartenaire,
  listTachesByPartenaire,
} from "@/actions/commerciaux"
import { Clock, Calendar, FileText, Activity } from "lucide-react"

interface CommercialActivitesTachesProps {
  commercialId: string
  organisationId: string
}

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function CommercialActivitesTaches({
  commercialId,
  organisationId,
}: CommercialActivitesTachesProps) {
  const [activites, setActivites] = React.useState<any[]>([])
  const [taches, setTaches] = React.useState<any[]>([])
  const [loadingActivites, setLoadingActivites] = React.useState(true)
  const [loadingTaches, setLoadingTaches] = React.useState(true)

  React.useEffect(() => {
    const fetchActivites = async () => {
      setLoadingActivites(true)
      const result = await listActivitesByPartenaire(organisationId, commercialId)
      if (result.data) {
        setActivites(result.data.data)
      }
      setLoadingActivites(false)
    }
    fetchActivites()
  }, [organisationId, commercialId])

  React.useEffect(() => {
    const fetchTaches = async () => {
      setLoadingTaches(true)
      const result = await listTachesByPartenaire(organisationId, commercialId)
      if (result.data) {
        setTaches(result.data.data)
      }
      setLoadingTaches(false)
    }
    fetchTaches()
  }, [organisationId, commercialId])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Activités Section */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="size-5" />
            Activités
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {loadingActivites ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : activites.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <Activity className="h-10 w-10 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Aucune activité</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  Les activités apparaîtront ici une fois enregistrées.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {activites.map((activite) => (
                  <div
                    key={activite.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Calendar className="size-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activite.sujet}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="size-3" />
                          <span>{formatDate(activite.dateActivite)}</span>
                        </div>
                        {activite.commentaire && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {activite.commentaire}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Tâches Section */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="size-5" />
            Tâches
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {loadingTaches ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : taches.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>Aucune tâche</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  Les tâches liées à ce commercial apparaîtront ici.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {taches.map((tache) => (
                  <div
                    key={tache.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <FileText className="size-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {tache.titre}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="size-3" />
                          <span>Échéance: {formatDate(tache.dateEcheance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

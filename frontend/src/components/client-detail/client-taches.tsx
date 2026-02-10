"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { listTachesByClient, marquerTacheTerminee } from "@/actions/taches"
import { CreateTacheDialog } from "@/app/(main)/taches/create-tache-dialog"
import {
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Calendar,
  FileText,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import type { Tache } from "@proto/activites/activites"
import type { TacheType, TachePriorite } from "@/lib/ui/labels/tache"
import { TACHE_TYPE_LABELS, TACHE_PRIORITE_LABELS } from "@/lib/ui/labels/tache"

const TYPE_ICONS: Record<TacheType, React.ReactNode> = {
  APPEL: <Phone className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  RDV: <Calendar className="h-4 w-4" />,
  RELANCE_IMPAYE: <FileText className="h-4 w-4" />,
  RELANCE_CONTRAT: <FileText className="h-4 w-4" />,
  RENOUVELLEMENT: <FileText className="h-4 w-4" />,
  SUIVI: <Clock className="h-4 w-4" />,
  AUTRE: <MoreHorizontal className="h-4 w-4" />,
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return "Demain"
  if (isPast(date)) return "En retard"
  return format(date, "dd MMM", { locale: fr })
}

interface ClientTachesProps {
  clientId: string
}

export function ClientTaches({ clientId }: ClientTachesProps) {
  const [taches, setTaches] = React.useState<Tache[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const result = await listTachesByClient(clientId)

    if (result.data) {
      setTaches(result.data.data)
    }
    setLoading(false)
  }, [clientId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleComplete = async (id: string) => {
    const result = await marquerTacheTerminee(id)
    if (result.data) {
      toast.success("Tâche terminée")
      fetchData()
    } else {
      toast.error(result.error || "Erreur lors de la complétion")
    }
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

  // Filtrer les tâches actives (non terminées, non annulées) en premier
  const activeTaches = taches.filter(
    (t) => t.statut === "A_FAIRE" || t.statut === "EN_COURS"
  )
  const doneTaches = taches.filter(
    (t) => t.statut === "TERMINEE" || t.statut === "ANNULEE"
  )
  const sortedTaches = [...activeTaches, ...doneTaches]

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Tâches client</h3>
            <Badge variant="secondary">{taches.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTaches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Aucune tâche enregistrée pour ce client
              </p>
              <p className="text-sm text-muted-foreground">
                Créez une tâche pour commencer le suivi
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {sortedTaches.map((tache) => {
                  const date = new Date(tache.dateEcheance)
                  const isLate =
                    tache.statut !== "TERMINEE" &&
                    tache.statut !== "ANNULEE" &&
                    isPast(date)
                  const isDone =
                    tache.statut === "TERMINEE" || tache.statut === "ANNULEE"

                  return (
                    <div
                      key={tache.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isLate
                          ? "border-destructive bg-destructive/5"
                          : isDone
                            ? "opacity-50"
                            : "border-border"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          isLate
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted"
                        }`}
                      >
                        {TYPE_ICONS[tache.type as TacheType]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            isLate
                              ? "text-destructive"
                              : isDone
                                ? "line-through"
                                : ""
                          }`}
                        >
                          {tache.titre}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {TACHE_TYPE_LABELS[tache.type as TacheType]}
                          </span>
                          <span>•</span>
                          <span
                            className={
                              isLate
                                ? "text-destructive font-medium"
                                : isToday(date)
                                  ? "text-orange-600 font-medium"
                                  : ""
                            }
                          >
                            {getDateLabel(date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tache.priorite === "HAUTE"
                              ? "destructive"
                              : tache.priorite === "MOYENNE"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {
                            TACHE_PRIORITE_LABELS[
                              tache.priorite as TachePriorite
                            ]
                          }
                        </Badge>
                        {!isDone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleComplete(tache.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <CreateTacheDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        onSuccess={fetchData}
      />
    </>
  )
}

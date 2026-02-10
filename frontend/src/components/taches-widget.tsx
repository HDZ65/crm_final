"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { listMyTaches, marquerTacheTerminee } from "@/actions/taches"
import { useOrganisation } from "@/contexts/organisation-context"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  FileText,
  MoreHorizontal,
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

function TacheItem({ tache, onComplete }: { tache: Tache; onComplete: (id: string) => void }) {
  const date = new Date(tache.dateEcheance)
  const isLate = tache.statut !== 'TERMINEE' && tache.statut !== 'ANNULEE' && isPast(date)
  const isDueToday = isToday(date)

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isLate ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
      <div className={`p-2 rounded-full ${isLate ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
        {TYPE_ICONS[tache.type as TacheType]}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isLate ? 'text-destructive' : ''}`}>
          {tache.titre}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{TACHE_TYPE_LABELS[tache.type as TacheType]}</span>
          <span>•</span>
          <span className={isLate ? 'text-destructive font-medium' : isDueToday ? 'text-orange-600 font-medium' : ''}>
            {getDateLabel(date)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={
            tache.priorite === 'HAUTE' ? 'destructive' :
            tache.priorite === 'MOYENNE' ? 'default' : 'secondary'
          }
          className="text-xs"
        >
          {TACHE_PRIORITE_LABELS[tache.priorite as TachePriorite]}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onComplete(tache.id)}
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function TachesWidget() {
  const { utilisateur } = useOrganisation()
  const [taches, setTaches] = React.useState<Tache[]>([])
  const fetchTaches = React.useCallback(async () => {
    if (!utilisateur?.id) return
    const result = await listMyTaches(utilisateur.id, "semaine")
    if (result.data) {
      setTaches(result.data)
    }
  }, [utilisateur?.id])

  React.useEffect(() => {
    fetchTaches()
  }, [fetchTaches])

  const handleComplete = async (id: string) => {
    const result = await marquerTacheTerminee(id)
    if (result.data) {
      toast.success("Tâche terminée")
      fetchTaches()
    } else {
      toast.error(result.error || "Erreur lors de la complétion")
    }
  }

  // Trier par priorité puis par date
  const sortedTaches = React.useMemo(() => {
    const priorityOrder: Record<string, number> = { HAUTE: 0, MOYENNE: 1, BASSE: 2 }
    return [...taches]
      .filter(t => t.statut === 'A_FAIRE' || t.statut === 'EN_COURS')
      .sort((a, b) => {
        // D'abord les tâches en retard
        const aLate = isPast(new Date(a.dateEcheance)) ? 0 : 1
        const bLate = isPast(new Date(b.dateEcheance)) ? 0 : 1
        if (aLate !== bLate) return aLate - bLate

        // Puis par priorité
        const aPriority = priorityOrder[a.priorite] ?? 1
        const bPriority = priorityOrder[b.priorite] ?? 1
        if (aPriority !== bPriority) return aPriority - bPriority

        // Puis par date
        return new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime()
      })
      .slice(0, 5)
  }, [taches])

  const lateCount = taches.filter(
    t => (t.statut === 'A_FAIRE' || t.statut === 'EN_COURS') && isPast(new Date(t.dateEcheance))
  ).length

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Mes tâches</CardTitle>
          {lateCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lateCount} en retard
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/taches">
            Voir tout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {sortedTaches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune tâche en attente</p>
            <p className="text-sm text-muted-foreground">Vous êtes à jour !</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-2">
              {sortedTaches.map((tache) => (
                <TacheItem
                  key={tache.id}
                  tache={tache}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

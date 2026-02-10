"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Mail,
  Users,
  MapPin,
  FileText,
  Circle,
  Plus,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react"
import type { ActiviteDto } from "@/actions/activites"
import type { TypeActiviteDto } from "@/actions/type-activites"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const TYPE_ICONS: Record<string, React.ElementType> = {
  APPEL: Phone,
  EMAIL: Mail,
  REUNION: Users,
  VISITE: MapPin,
  NOTE: FileText,
  AUTRE: Circle,
}

const TYPE_COLORS: Record<string, string> = {
  APPEL: "bg-green-500",
  EMAIL: "bg-blue-500",
  REUNION: "bg-purple-500",
  VISITE: "bg-orange-500",
  NOTE: "bg-gray-500",
  AUTRE: "bg-slate-500",
}

interface ActivitesTimelineProps {
  activites: ActiviteDto[]
  typesActivite?: TypeActiviteDto[]
  onAddActivite?: () => void
  onEditActivite?: (activite: ActiviteDto) => void
  title?: string
  emptyMessage?: string
  showAddButton?: boolean
  maxHeight?: string
}

export function ActivitesTimeline({
  activites,
  typesActivite = [],
  onAddActivite,
  onEditActivite,
  title = "Activités",
  emptyMessage = "Aucune activité enregistrée",
  showAddButton = true,
  maxHeight = "h-96",
}: ActivitesTimelineProps) {
  const typesMap = React.useMemo(() => {
    const map = new Map<string, TypeActiviteDto>()
    typesActivite.forEach((t) => map.set(t.id, t))
    return map
  }, [typesActivite])

  const getTypeInfo = (typeId: string) => {
    const type = typesMap.get(typeId)
    const code = type?.code || "AUTRE"
    return {
      nom: type?.nom || "Autre",
      code,
      Icon: TYPE_ICONS[code] || Circle,
      color: TYPE_COLORS[code] || "bg-slate-500",
    }
  }

  const sortedActivites = React.useMemo(() => {
    return [...activites].sort(
      (a, b) =>
        new Date(b.dateActivite).getTime() - new Date(a.dateActivite).getTime()
    )
  }, [activites])

  return (
    <Card className={`${maxHeight} flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="size-5" />
            {title}
            {activites.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activites.length}
              </Badge>
            )}
          </CardTitle>
          {showAddButton && onAddActivite && (
            <Button size="sm" variant="outline" onClick={onAddActivite}>
              <Plus className="size-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {sortedActivites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="size-12 mb-2 opacity-20" />
            <p>{emptyMessage}</p>
            {showAddButton && onAddActivite && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={onAddActivite}
              >
                <Plus className="size-4 mr-1" />
                Créer une activité
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <ul className="space-y-4">
              {sortedActivites.map((activite, i) => {
                const typeInfo = getTypeInfo(activite.typeId)
                const Icon = typeInfo.Icon

                return (
                  <li
                    key={activite.id}
                    className="flex items-start gap-3 relative group cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => onEditActivite?.(activite)}
                  >
                    <div
                      className={`mt-0.5 rounded-full ${typeInfo.color} text-white p-2 shadow-sm z-10`}
                    >
                      <Icon className="size-4" />
                    </div>
                    {i < sortedActivites.length - 1 && (
                      <div className="absolute left-[18px] top-10 w-0.5 h-[calc(100%-24px)] bg-border" />
                    )}
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">
                          {activite.sujet}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.nom}
                        </Badge>
                      </div>
                      {activite.commentaire && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {activite.commentaire}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(activite.dateActivite).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDistanceToNow(new Date(activite.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                        {activite.echeance && (
                          <span className="flex items-center gap-1 text-warning">
                            Échéance:{" "}
                            {new Date(activite.echeance).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

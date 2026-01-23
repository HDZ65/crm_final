"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Circle,
} from "lucide-react"
import type { EvenementSuiviDto } from "@/types/activite"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const CODE_ICONS: Record<string, React.ElementType> = {
  PRISE_EN_CHARGE: Package,
  EN_TRANSIT: Truck,
  EN_LIVRAISON: MapPin,
  LIVRE: CheckCircle2,
  ECHEC_LIVRAISON: XCircle,
  RETOUR: RotateCcw,
}

const CODE_COLORS: Record<string, string> = {
  PRISE_EN_CHARGE: "bg-blue-500",
  EN_TRANSIT: "bg-indigo-500",
  EN_LIVRAISON: "bg-yellow-500",
  LIVRE: "bg-green-500",
  ECHEC_LIVRAISON: "bg-red-500",
  RETOUR: "bg-gray-500",
}

const CODE_LABELS: Record<string, string> = {
  PRISE_EN_CHARGE: "Prise en charge",
  EN_TRANSIT: "En transit",
  EN_LIVRAISON: "En cours de livraison",
  LIVRE: "Livré",
  ECHEC_LIVRAISON: "Échec de livraison",
  RETOUR: "Retour",
}

interface EvenementsSuiviTimelineProps {
  evenements: EvenementSuiviDto[]
  title?: string
  emptyMessage?: string
  maxHeight?: string
}

export function EvenementsSuiviTimeline({
  evenements,
  title = "Suivi de l'expédition",
  emptyMessage = "Aucun événement de suivi",
  maxHeight = "h-80",
}: EvenementsSuiviTimelineProps) {
  const sortedEvenements = React.useMemo(() => {
    return [...evenements].sort(
      (a, b) =>
        new Date(a.dateEvenement).getTime() - new Date(b.dateEvenement).getTime()
    )
  }, [evenements])

  const getEventInfo = (code: string) => {
    const upperCode = code.toUpperCase()
    return {
      Icon: CODE_ICONS[upperCode] || Circle,
      color: CODE_COLORS[upperCode] || "bg-slate-500",
      label: CODE_LABELS[upperCode] || code,
    }
  }

  return (
    <Card className={`${maxHeight} flex flex-col`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="size-5" />
          {title}
          {evenements.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {evenements.length} événement{evenements.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {sortedEvenements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="size-12 mb-2 opacity-20" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <ul className="space-y-3">
              {sortedEvenements.map((evenement, i) => {
                const eventInfo = getEventInfo(evenement.code)
                const Icon = eventInfo.Icon
                const isLast = i === sortedEvenements.length - 1

                return (
                  <li
                    key={evenement.id}
                    className="flex items-start gap-3 relative"
                  >
                    <div
                      className={`mt-0.5 rounded-full ${eventInfo.color} text-white p-2 shadow-sm z-10 ${
                        isLast ? "ring-2 ring-offset-2 ring-offset-background" : ""
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    {i < sortedEvenements.length - 1 && (
                      <div className="absolute left-[18px] top-10 w-0.5 h-[calc(100%-16px)] bg-border" />
                    )}
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {evenement.label || eventInfo.label}
                        </span>
                        {isLast && (
                          <Badge variant="default" className="text-xs">
                            Dernier statut
                          </Badge>
                        )}
                      </div>
                      {evenement.lieu && (
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="size-3" />
                          {evenement.lieu}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(evenement.dateEvenement).toLocaleString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <span className="text-muted-foreground/60">
                          {formatDistanceToNow(new Date(evenement.dateEvenement), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
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

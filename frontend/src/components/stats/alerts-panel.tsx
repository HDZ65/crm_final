"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, XCircle, Users, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Alert } from "@/types/stats"

interface AlertsPanelProps {
  alerts: Alert[]
}

const alertIcons = {
  impaye: XCircle,
  churn: AlertTriangle,
  cq: AlertCircle,
  doublon: Users,
}

const severityColors = {
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/30",
  },
  danger: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
  },
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const formatValue = (alert: Alert) => {
    if (alert.type === "impaye" || alert.type === "churn") {
      return `${alert.value.toFixed(1)}%`
    }
    return alert.value.toString()
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Alertes & Risques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-3 mb-3">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h4 className="font-medium text-green-700">Tout est sous contrôle</h4>
            <p className="text-sm text-muted-foreground mt-1">Aucune alerte ni risque détecté</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Alertes & Risques</CardTitle>
        <Badge variant="destructive" className="rounded-full">
          {alerts.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type]
            const colors = severityColors[alert.severity]

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex gap-3 p-3 rounded-lg border",
                  colors.bg,
                  colors.border
                )}
              >
                <Icon className={cn("size-5 shrink-0 mt-0.5", colors.text)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn("font-medium text-sm", colors.text)}>
                      {alert.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(alert.date)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge variant="outline" className={colors.text}>
                      Valeur: {formatValue(alert)}
                    </Badge>
                    <span className="text-muted-foreground">
                      Seuil: {alert.type === "impaye" || alert.type === "churn" ? `${alert.threshold}%` : alert.threshold}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
